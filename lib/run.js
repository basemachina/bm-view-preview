import process from "node:process";
import path from "node:path";
import { chromium } from "playwright";
import { xdgCache } from "xdg-basedir";
import { watch } from "./watch.js";
import { isViewPage, ViewPage } from "./ViewPage.js";

export const run = async ({ viewSourceFilePath, url }) => {
  if (!viewSourceFilePath) {
    console.error("ビューのソースファイルを指定してください");
    process.exit(1);
  }

  const watcher = watch(viewSourceFilePath);

  const browser = await chromium.launchPersistentContext(
    path.join(xdgCache, "bmview-preview", "chromium_profile"),
    {
      headless: false,
      viewport: null, // ウィンドウのリサイズに合わせてviewportのサイズを変える
    }
  );

  // とりあえず最初のタブだけ監視対象にしている
  const page = (await browser.pages())[0];

  // alert, confirmなどを自動で閉じないようにする
  page.on("dialog", () => {});

  // NOTE: loadイベントではrouterによるページ遷移を拾えない
  // TOOD: ViewPage.connect()が成功したあとに別ページに遷移したらdisconnect()できるようにする
  page.on("load", async () => {
    if (isViewPage(page.url())) {
      ViewPage.connect(page, watcher);
      console.log(`ビューのエディタに接続しました (url: ${url})`);
    }
  });

  if (url) {
    await page.goto(url);
  } else {
    console.log(
      "最初のタブでビューの新規作成ページを開いてからリロードしてください"
    );
  }
};
