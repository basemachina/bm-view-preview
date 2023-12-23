import process from "node:process";
import path from "node:path";
import { chromium } from "playwright";
import { xdgCache } from "xdg-basedir";
import { watch } from "./watch.js";
import { ViewPage } from "./viewPage.js";

const viewSourceFilePath = process.argv[2];
if (!viewSourceFilePath) {
  console.error("ビューのソースファイルを指定してください");
  process.exit(1);
}
const watcher = watch(viewSourceFilePath);

(async () => {
  const browser = await chromium.launchPersistentContext(
    path.join(xdgCache, "bmview-preview", "chromium_profile"),
    {
      headless: false,
      viewport: null, // ウィンドウのリサイズに合わせてviewportのサイズを変える
    }
  );
  console.log(
    "最初のタブでビューの新規作成ページを開いてからリロードしてください"
  );

  // とりあえず最初のタブだけ監視対象にしている
  const page = (await browser.pages())[0];

  // alert, confirmなどを自動で閉じないようにする
  page.on("dialog", () => {});

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
