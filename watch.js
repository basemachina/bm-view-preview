const fs = require("node:fs/promises");

async function* watch(filePath) {
  const read = () => fs.readFile(filePath, { encoding: "utf8" });
  yield read();

  const watcher = fs.watch(filePath);
  for await (const event of watcher) {
    if (event.eventType !== "change") {
      continue;
    }
    yield read();
  }
}

module.exports = {
  watch,
};
