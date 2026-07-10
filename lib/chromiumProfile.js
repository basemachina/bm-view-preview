import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// SingletonLock symlinkの参照先 "hostname-pid" をパースする。
// hostname自体にハイフンを含むことがあるため、最後のハイフンで分割する。
export const parseSingletonLockTarget = (target) => {
  const match = /^(.+)-(\d+)$/.exec(target);
  if (!match) {
    return null;
  }
  return { hostname: match[1], pid: Number(match[2]) };
};

export const isProcessAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERMは「存在するが操作権限がない」なので生存扱い
    return error.code === "EPERM";
  }
};

// プロファイルを使用中の生きているChromiumプロセスのpidを返す。使用中でなければnull。
// 判定できないケース（lockなし・symlinkでない・パース不能・別ホストのlock・pid死亡）は
// すべてnullとし、扱いをChromium自身に委ねる（stale lockはChromiumが自力回復できる）。
export const getRunningChromiumPid = async (
  profileDir,
  { hostname = os.hostname(), isAlive = isProcessAlive } = {},
) => {
  let target;
  try {
    target = await fs.readlink(path.join(profileDir, "SingletonLock"));
  } catch {
    return null;
  }
  const parsed = parseSingletonLockTarget(target);
  if (!parsed || parsed.hostname !== hostname) {
    return null;
  }
  return isAlive(parsed.pid) ? parsed.pid : null;
};

// プロファイル破損などでChromiumが起動できなくなったとき、ログイン情報だけを
// 引き継いだ新しいプロファイルを作り直す。元のプロファイルは丸ごと退避して残す。
const carryOverEntries = [
  "Local State", // Cookieの暗号鍵などを含む
  "Default/Cookies",
  "Default/Cookies-journal",
  "Default/Login Data",
  "Default/Login Data-journal",
  "Default/Login Data For Account",
  "Default/Login Data For Account-journal",
  "Default/Local Storage",
  "Default/WebStorage",
];

export const repairChromiumProfile = async (profileDir) => {
  const backupDir = `${profileDir}.broken-${Date.now()}`;
  await fs.rename(profileDir, backupDir);
  await fs.mkdir(path.join(profileDir, "Default"), { recursive: true });

  for (const entry of carryOverEntries) {
    try {
      await fs.cp(path.join(backupDir, entry), path.join(profileDir, entry), {
        recursive: true,
      });
    } catch {
      // 存在しないファイルはスキップ
    }
  }

  return backupDir;
};
