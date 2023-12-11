const { argv, exit } = require("node:process");
const { chromium } = require("playwright");
const { watch } = require("./watch");
const { ViewPage } = require("./viewPage");

const viewSourceFilePath = argv[2];
if (!viewSourceFilePath) {
  console.error("view source file path is not given.");
  exit(1);
}
const watcher = watch(viewSourceFilePath);

(async () => {
  const browser = await chromium.launchPersistentContext("./user_data", {
    headless: false,
  });
  const page = (await browser.pages())[0];

  // TODO: loadイベントではrouterによるページ遷移を拾えないので別方法にする
  page.on("load", async () => {
    setTimeout(() => {
      const url = new URL(page.url());
      if (url.pathname.includes("/views/new")) {
        console.log("connecting");
        ViewPage.connect(page, watcher);
      }
    }, 5000);
  });
})();
