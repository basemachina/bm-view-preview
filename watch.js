const fs = require("node:fs/promises");

/** ファイルが変更されるごとにファイルの内容を返すAsyncGenerator */
async function* watch(filePath) {
  const read = () => fs.readFile(filePath, { encoding: "utf8" });

  // 初回は更新されなくても内容を読んで返す
  yield read();

  const watcher = fs.watch(filePath);
  for await (const event of watcher) {
    if (event.eventType !== "change") {
      continue;
    }

    // 即座にファイルを読み込むと空になっていることがあるので少し待つ
    await new Promise((resolve) => setTimeout(resolve, 100));

    yield read();
  }
}

module.exports = {
  watch,
};
