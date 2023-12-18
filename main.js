const { argv, exit } = require("node:process");
const { chromium } = require("playwright");
const { watch } = require("./watch");
const { ViewPage } = require("./viewPage");

const viewSourceFilePath = argv[2];
if (!viewSourceFilePath) {
  console.error("ビューのソースファイルを指定してください");
  exit(1);
}
const watcher = watch(viewSourceFilePath);

(async () => {
  const browser = await chromium.launchPersistentContext("./user_data", {
    headless: false,
    viewport: null, // ウィンドウのリサイズに合わせてviewportのサイズを変える
  });
  console.log(
    "最初のタブでビューの新規作成ページを開いてからリロードしてください"
  );

  // とりあえず最初のタブだけ監視対象にしている
  const page = (await browser.pages())[0];

  // NOTE: loadイベントではrouterによるページ遷移を拾えない
  // TOOD: ViewPage.connect()が成功したあとに別ページに遷移したらdisconnect()できるようにする
  page.on("load", async () => {
    const url = new URL(page.url());
    if (url.pathname.includes("/views/new")) {
      ViewPage.connect(page, watcher);
      console.log(`ビューのエディタに接続しました (url: ${url})`);
    }
  });
})();
