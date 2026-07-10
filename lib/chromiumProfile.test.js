import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  getRunningChromiumPid,
  isProcessAlive,
  parseSingletonLockTarget,
  repairChromiumProfile,
} from "./chromiumProfile";

describe("parseSingletonLockTarget", () => {
  test.each([
    { target: "myhost-12345", expected: { hostname: "myhost", pid: 12345 } },
    // hostnameにハイフンを含む場合は最後のハイフンで分割する
    {
      target: "my-host.local-999",
      expected: { hostname: "my-host.local", pid: 999 },
    },
    { target: "nohyphen", expected: null },
    { target: "host-abc", expected: null },
    { target: "", expected: null },
  ])(
    "parseSingletonLockTarget($target) -> $expected",
    ({ target, expected }) => {
      expect(parseSingletonLockTarget(target)).toEqual(expected);
    },
  );
});

describe("isProcessAlive", () => {
  test("自プロセスのpidは生存扱い", () => {
    expect(isProcessAlive(process.pid)).toBe(true);
  });

  test("存在しないpidは死亡扱い", () => {
    // pidの上限(2^22など)を大きく超える値はESRCHになる
    expect(isProcessAlive(2 ** 30)).toBe(false);
  });
});

describe("getRunningChromiumPid", () => {
  let profileDir;

  beforeEach(async () => {
    profileDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "bm-view-preview-test-"),
    );
  });

  afterEach(async () => {
    await fs.rm(profileDir, { recursive: true, force: true });
  });

  const lockPath = () => path.join(profileDir, "SingletonLock");

  test("SingletonLockがなければnull", async () => {
    expect(await getRunningChromiumPid(profileDir)).toBe(null);
  });

  test("hostname一致かつpid生存ならpidを返す", async () => {
    await fs.symlink(`${os.hostname()}-${process.pid}`, lockPath());
    expect(await getRunningChromiumPid(profileDir)).toBe(process.pid);
  });

  test("pidが死んでいればnull（stale lockはChromiumに任せる）", async () => {
    await fs.symlink(`${os.hostname()}-${process.pid}`, lockPath());
    expect(
      await getRunningChromiumPid(profileDir, { isAlive: () => false }),
    ).toBe(null);
  });

  test("hostnameが一致しなければnull", async () => {
    await fs.symlink(`other-host-${process.pid}`, lockPath());
    expect(
      await getRunningChromiumPid(profileDir, { hostname: "this-host" }),
    ).toBe(null);
  });

  test("symlinkでなく通常ファイルならnull", async () => {
    await fs.writeFile(lockPath(), `${os.hostname()}-${process.pid}`);
    expect(await getRunningChromiumPid(profileDir)).toBe(null);
  });

  test("参照先がパース不能ならnull", async () => {
    await fs.symlink("garbage", lockPath());
    expect(await getRunningChromiumPid(profileDir)).toBe(null);
  });
});

describe("repairChromiumProfile", () => {
  let baseDir;
  let profileDir;

  beforeEach(async () => {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "bm-view-preview-test-"));
    profileDir = path.join(baseDir, "chromium_profile");
    await fs.mkdir(path.join(profileDir, "Default", "Local Storage"), {
      recursive: true,
    });
    await fs.writeFile(path.join(profileDir, "Local State"), "local state");
    await fs.writeFile(path.join(profileDir, "Default", "Cookies"), "cookies");
    await fs.writeFile(
      path.join(profileDir, "Default", "Local Storage", "data"),
      "storage",
    );
    // 引き継ぎ対象外
    await fs.writeFile(path.join(profileDir, "Default", "History"), "history");
    await fs.writeFile(path.join(profileDir, "Variations"), "variations");
  });

  afterEach(async () => {
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  test("元のプロファイルを退避し、ログイン関連のみ引き継ぐ", async () => {
    const backupDir = await repairChromiumProfile(profileDir);

    // 退避先に元の内容が丸ごと残っている
    expect(backupDir).not.toBe(profileDir);
    await expect(
      fs.readFile(path.join(backupDir, "Default", "History"), "utf8"),
    ).resolves.toBe("history");

    // 新しいプロファイルにはログイン関連だけがある
    await expect(
      fs.readFile(path.join(profileDir, "Local State"), "utf8"),
    ).resolves.toBe("local state");
    await expect(
      fs.readFile(path.join(profileDir, "Default", "Cookies"), "utf8"),
    ).resolves.toBe("cookies");
    await expect(
      fs.readFile(
        path.join(profileDir, "Default", "Local Storage", "data"),
        "utf8",
      ),
    ).resolves.toBe("storage");
    await expect(
      fs.access(path.join(profileDir, "Default", "History")),
    ).rejects.toThrow();
    await expect(
      fs.access(path.join(profileDir, "Variations")),
    ).rejects.toThrow();
  });

  test("引き継ぎ対象が存在しなくてもエラーにならない", async () => {
    await fs.rm(path.join(profileDir, "Default", "Cookies"));
    await fs.rm(path.join(profileDir, "Local State"));

    const backupDir = await repairChromiumProfile(profileDir);

    expect(backupDir).not.toBe(profileDir);
    await expect(
      fs.access(path.join(profileDir, "Default")),
    ).resolves.toBeUndefined();
  });
});
