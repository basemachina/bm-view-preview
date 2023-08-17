const fs = require("node:fs/promises");

async function* watch(filePath) {
  const watcher = fs.watch(filePath);
  for await (const event of watcher) {
    if (event.eventType !== "change") {
      continue;
    }
    yield fs.readFile(filePath, { encoding: "utf8" });
  }
}

module.exports = {
  watch,
};
