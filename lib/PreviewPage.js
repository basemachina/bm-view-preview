import path from "path";
import { fileURLToPath } from "url";

// ref. https://teno-hira.com/media/?p=1615
const __dirname = (() => {
  const __filename = fileURLToPath(import.meta.url);
  return path.dirname(__filename);
})();

export const isNewViewPage = (url) => {
  const { pathname } = new URL(url);
  const regexp = new RegExp("^/projects/[^/]+/environments/[^/]+/views/new$");
  return regexp.test(pathname);
};

export const getEnvironment = (url) => {
  const { pathname } = new URL(url);
  const regexp = new RegExp(
      "^/projects/[^/]+/environments/([^/]+)/views/new$"
  );
  const match = pathname.match(regexp);
  return match?.[1];
}

const inPageCallbackFunctionName = "__bmViewPreviewOnSelectView";
const bmViewPreviewViewListId = "bm-view-preview-view-list";

export class PreviewPage {
  constructor(page) {
    this.page = page;
  }

  async init() {
    // プレビュー領域以外を隠す
    this.page.addStyleTag({
      path: path.join(__dirname, "./previewPage.css"),
    });

    // ページ内でビューが選択されたときに呼ばれるコールバック関数を登録する
    if (
      // 同じタブに複数回同じコールバック関数を登録しようとするとエラーが起きるので存在チェックする
      await this.page.evaluate(
        (target) => !(target in window),
        inPageCallbackFunctionName
      )
    ) {
      this.page.exposeFunction(
        inPageCallbackFunctionName,
        (viewDisplayName) => {
          this.onViewSelected(viewDisplayName);
        }
      );
    }

    // ページ内にビューの一覧を表示する領域を作る
    this.page.evaluate((bmViewPreviewViewListId) => {
      // Reactの管理外に置くため、html要素の直下にDOMノードを置く
      const $sidebar = document.createElement("div");
      $sidebar.setAttribute("id", bmViewPreviewViewListId);
      $sidebar.setAttribute("class", "bg-slate-50 p-4 w-64 space-y-2");
      document.documentElement.appendChild($sidebar);
    }, bmViewPreviewViewListId);

    // monacoがロードされるまで待つ
    await this.page.waitForFunction(
      () => window.monaco?.editor?.getEditors()?.[0],
      null,
      {
        polling: 100, // 100ms
        timeout: 0, // disable timeout
      }
    );

    // 新規作成時のサンプルコードを上書きする
    this.updateViewCode(
      `export default () => "プレビューするファイルを選択してください。";`
    );
  }

  // ページ内のビューの一覧を更新する
  async updateViewList(filenames) {
    this.page.evaluate(
      ([filenames, bmViewPreviewViewListId, inPageCallbackFunctionName]) => {
        const $sidebar = document.getElementById(bmViewPreviewViewListId);
        $sidebar.replaceChildren(); // 子要素をすべて消す
        for (const filename of filenames) {
          const $button = document.createElement("button");
          $button.setAttribute(
            "class",
            "p-2 text-left w-full rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900"
          );
          $button.textContent = filename;
          $button.addEventListener("click", () => {
            window[inPageCallbackFunctionName](filename);
          });
          $sidebar.appendChild($button);
        }
      },
      [filenames, bmViewPreviewViewListId, inPageCallbackFunctionName]
    );
  }

  // ページ内のmonacoエディタにコードを入力する
  async updateViewCode(code) {
    this.page.evaluate((code) => {
      const editor = window.monaco?.editor?.getEditors()?.[0];
      editor?.setValue(code);
    }, code);
  }
}
