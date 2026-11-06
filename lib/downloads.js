import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const defaultDownloadDir = () => path.join(os.homedir(), "Downloads");

const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// 同名のファイルがあれば Chrome と同じく "name (1).ext" のように連番を付ける
export const resolveUniquePath = async (dir, fileName) => {
  const { name, ext } = path.parse(fileName);
  let candidate = path.join(dir, fileName);
  for (let i = 1; await exists(candidate); i++) {
    candidate = path.join(dir, `${name} (${i})${ext}`);
  }
  return candidate;
};

// Playwright で起動したブラウザはダウンロードしたファイルを UUID のファイル名で一時ディレクトリに保存し、
// ブラウザを閉じると削除する。ページが指定したファイル名でダウンロードフォルダに保存し直す
export const saveDownload = async (download, dir) => {
  await fs.mkdir(dir, { recursive: true });
  const savePath = await resolveUniquePath(dir, download.suggestedFilename());
  await download.saveAs(savePath);
  return savePath;
};

export const handleDownloads = (page, dir = defaultDownloadDir()) => {
  page.on("download", async (download) => {
    try {
      const savePath = await saveDownload(download, dir);
      console.log(`ダウンロードしたファイルを保存しました: ${savePath}`);
    } catch (err) {
      console.error("ダウンロードしたファイルの保存に失敗しました", err);
    }
  });
};
