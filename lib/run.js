import process from "node:process";
import path from "node:path";
import { chromium } from "playwright";
import envPaths from "env-paths";
import { watchFile, watchDirectory } from "./watch.js";
import { isNewViewPage, PreviewPage, getEnvironment } from "./PreviewPage.js";

const appEnvPaths = envPaths("bm-view-preview");

export const run = async ({ baseUrl, sourceDir, allowedEnvironments }) => {
  if (!baseUrl) {
    console.error("ベースマキナのURLを指定してください");
    process.exit(1);
  }

  const baseViewPage = `${baseUrl}/views/new`;

  if (allowedEnvironments && !allowedEnvironments.includes(getEnvironment(baseViewPage))) {
    console.error("baseUrlに設定されたEnvironmentが許可されていない環境です");
    process.exit(1);
  }

  const browser = await chromium.launchPersistentContext(
    path.join(appEnvPaths.cache, "chromium_profile"),
    {
      headless: false,
      viewport: null, // ウィンドウのリサイズに合わせてviewportのサイズを変える
      chromiumSandbox: true,
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
    // ログインセッションが切れているとログイン画面に飛ばされるので少し待つ
    await new Promise((r) => setTimeout(r, 1000));

    const environment = getEnvironment(page.url());

    if (allowedEnvironments && environment && !allowedEnvironments.includes(environment)) {
      // 許可されていない環境の場合、baseUrlにリダイレクトする
      await page.goto(baseViewPage);
      return;
    }

    if (!isNewViewPage(page.url())) {
      return;
    }

    const previewPage = new PreviewPage(page);
    await previewPage.init();

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

  await page.goto(baseViewPage);
};
