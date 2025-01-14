import fs from "node:fs";

/** 呼び出しの直後とディレクトリが更新されるごとにファイルの一覧を引数にしてコールバック関数を呼ぶ */
export const watchDirectory = async (dirPath, callback) => {
  const notify = () =>
    fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
      if (err) throw err;
      callback(
        entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
      );
    });
  notify();
  fs.watch(dirPath, notify);
};
