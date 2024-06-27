import fs from "node:fs";

/** 呼び出しの直後とファイルが変更されるごとにファイルの内容を引数にしてコールバック関数を呼ぶ */
export const watchFile = (filePath, callback) => {
  const notify = () =>
    fs.readFile(filePath, { encoding: "utf8" }, (err, content) => {
      if (err) throw err;
      callback(content);
    });

  notify();

  return fs.watch(filePath, async (eventType) => {
    if (eventType !== "change") return;

    // 即座にファイルを読み込むと空になっていることがあるので少し待つ
    setTimeout(notify, 100);
  });
};

/** 呼び出しの直後とディレクトリが更新されることにファイルの一覧を引数にしてコールバック関数を呼ぶ */
export const watchDirectory = async (dirPath, callback) => {
  const notify = () =>
    fs.readdir(dirPath, (err, files) => {
      if (err) throw err;
      callback(files);
    });
  notify();
  fs.watch(dirPath, notify);
};
