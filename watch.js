const fs = require("node:fs/promises");

async function* watch(filePath) {
  const read = () => fs.readFile(filePath, { encoding: "utf8" });
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
