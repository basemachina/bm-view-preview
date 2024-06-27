import process from "node:process";
import path from "node:path";
import { chromium } from "playwright";
import { xdgCache } from "xdg-basedir";
import { watchFile, watchDirectory } from "./watch.js";
import { isNewViewPage, PreviewPage } from "./PreviewPage.js";

export const run = async ({ baseUrl, sourceDir }) => {
  if (!baseUrl) {
    console.error("ベースマキナのURLを指定してください");
    process.exit(1);
  }

  const browser = await chromium.launchPersistentContext(
    path.join(xdgCache, "bmview-preview", "chromium_profile"),
    {
      headless: false,
      viewport: null, // ウィンドウのリサイズに合わせてviewportのサイズを変える
      bypassCSP: true,
    }
  );

  // とりあえず最初のタブだけ監視対象にしている
  const page = (await browser.pages())[0];

  // 最初のタブが閉じられたら終了する
  page.on("close", () => {
    process.exit();
  });

  // alert, confirmなどを自動で閉じないようにする
  page.on("dialog", () => {});

  // NOTE: loadイベントではrouterによるページ遷移を拾えない
  page.on("load", async () => {
    if (!isNewViewPage(page.url())) {
      return;
    }

    const previewPage = new PreviewPage(page);

    let viewFileWatcher;
    previewPage.onViewSelected = (viewFileName) => {
      // すでにwatcherを作っていたら停止する
      viewFileWatcher?.close();

      // ファイルが変更されるたびにmonacoに入力する
      viewFileWatcher = watchFile(
        path.resolve(sourceDir, viewFileName),
        (code) => previewPage.updateViewCode(code)
      );
    };

    watchDirectory(sourceDir, (filenames) => {
      previewPage.updateViewList(filenames);
    });
  });

  const newViewPage = `${baseUrl}/views/new`;
  await page.goto(newViewPage);
};
