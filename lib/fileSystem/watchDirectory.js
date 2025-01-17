import fs from "node:fs";
import { listFiles } from "./listFiles.js";

/** 呼び出しの直後とディレクトリが更新されるごとにファイルの一覧を引数にしてコールバック関数を呼ぶ */
export const watchDirectory = async (dirPath, callback) => {
  const notify = async () => callback(await listFiles(dirPath));
  fs.watch(dirPath, notify);
};
