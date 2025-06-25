import process from "node:process";
import path from "node:path";
import { chromium } from "playwright";
import envPaths from "env-paths";
import { watchFile } from "./fileSystem/watchFile.js";
import { watchDirectory } from "./fileSystem/watchDirectory.js";
import { listFiles } from "./fileSystem/listFiles.js";
import {
  isBmViewPreviewPage,
  PreviewPage,
  getEnvironment,
} from "./PreviewPage.js";

const appEnvPaths = envPaths("bm-view-preview");

export const run = async ({
  baseUrl,
  sourceDir,
  allowedEnvironments,
  allowExtensions = false,
}) => {
  if (!baseUrl) {
    console.error("ベースマキナのURLを指定してください");
    process.exit(1);
  }

  const bmViewPreviewPage = `${baseUrl}/views/bm-view-preview`;

  if (
    allowedEnvironments &&
    !allowedEnvironments.includes(getEnvironment(bmViewPreviewPage))
  ) {
    console.error("baseUrlに設定されたEnvironmentが許可されていない環境です");
    process.exit(1);
  }

  const browser = await chromium.launchPersistentContext(
    path.join(appEnvPaths.cache, "chromium_profile"),
    {
      headless: false,
      viewport: null, // ウィンドウのリサイズに合わせてviewportのサイズを変える
      chromiumSandbox: true,
      ...(allowExtensions
        ? { ignoreDefaultArgs: ["--disable-extensions"] }
        : {}),
    },
  );

  // とりあえず最初のタブだけ監視対象にしている
  const page = (await browser.pages())[0];

  // 最初のタブが閉じられたら終了する
  page.on("close", async () => {
    await browser.close();
    process.exit();
  });

  // alert, confirmなどを自動で閉じないようにする
  page.on("dialog", () => {});

  let lastSelectedFileName = null;

  // NOTE: loadイベントではrouterによるページ遷移を拾えない
  page.on("load", async () => {
    // ログインセッションが切れているとログイン画面に飛ばされるので少し待つ
    await new Promise((r) => setTimeout(r, 1000));

    const environment = getEnvironment(page.url());

    if (
      allowedEnvironments &&
      environment &&
      !allowedEnvironments.includes(environment)
    ) {
      // 許可されていない環境の場合、bmViewPreviewPageにリダイレクトする
      await page.goto(bmViewPreviewPage);
      return;
    }

    if (!isBmViewPreviewPage(page.url())) {
      return;
    }

    const previewPage = new PreviewPage(page);

    let viewFileWatcher;
    previewPage.onViewSelected = (viewFileName) => {
      lastSelectedFileName = viewFileName;

      // すでにwatcherを作っていたら停止する
      viewFileWatcher?.close();

      // ファイルが変更されるたびにプレピューページに反映する
      viewFileWatcher = watchFile(
        path.resolve(sourceDir, viewFileName),
        (code) => {
          previewPage.updateViewCode(code);
        },
      );
    };

    // ファイルを選択したことがあれば再表示する
    // （URLバーにクエリパラメーターを追加してページを再読み込みしたとき、初期画面ではなく選択していたファイルを表示させるため）
    const selectedViewFileName = await (async () => {
      if (lastSelectedFileName === null) {
        return null;
      }
      const files = await listFiles(sourceDir);
      if (!files.includes(lastSelectedFileName)) {
        return null;
      }
      return lastSelectedFileName;
    })();

    await previewPage.init({ selectedViewFileName });

    watchDirectory(sourceDir, (filenames) => {
      previewPage.setViewList(filenames);
      previewPage.updateViewList();
    });
  });

  await page.goto(bmViewPreviewPage);
};
