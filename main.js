const { chromium } = require("playwright");
const { watch } = require("./watch");
const { ViewPage } = require("./viewPage");

const watcher = watch("./view.js");

(async () => {
  const browser = await chromium.launchPersistentContext("./user_data", {
    headless: false,
  });
  const page = (await browser.pages())[0];

  // TODO: loadイベントではrouterによるページ遷移を拾えないので別方法にする
  page.on("load", async () => {
    const url = new URL(page.url());
    if (url.pathname.includes("/views/new")) {
      console.log("connecting");
      ViewPage.connect(page, watcher);
    }
  });
})();
