import fs from "node:fs/promises";

/** ディレクトリのファイルの一覧を返す */
export const listFiles = async (dirPath) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
};
