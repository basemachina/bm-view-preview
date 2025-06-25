import path from "path";
import { fileURLToPath } from "url";

// ref. https://teno-hira.com/media/?p=1615
const __dirname = (() => {
  const __filename = fileURLToPath(import.meta.url);
  return path.dirname(__filename);
})();

export const isBmViewPreviewPage = (url) => {
  const { pathname } = new URL(url);
  const regexp = new RegExp(
    "^/projects/[^/]+/environments/[^/]+/views/bm-view-preview$",
  );
  return regexp.test(pathname);
};

export const getEnvironment = (url) => {
  const { pathname } = new URL(url);
  const regexp = new RegExp(
    "^/projects/[^/]+/environments/([^/]+)/views/bm-view-preview$",
  );
  const match = pathname.match(regexp);
  return match?.[1];
};

const inPageSelectViewCallbackFunctionName = "__bmViewPreviewOnSelectView";
const inPageSearchInputCallbackFunctionName = "__bmViewPreviewOnSearchInput";
const bmViewPreviewViewListId = "bm-view-preview-view-list";
const setCodeEventName = "bmViewPreviewSetCode";

export class PreviewPage {
  #viewList = [];
  #searchQuery = "";

  constructor(page) {
    this.page = page;
  }

  setViewList(viewList) {
    this.#viewList = viewList;
  }

  setSearchQuery(searchQuery) {
    this.#searchQuery = searchQuery;
  }

  async init({ selectedViewFileName }) {
    // プレビュー領域以外を隠す
    this.page.addStyleTag({
      path: path.join(__dirname, "./previewPage.css"),
    });

    // ページ内でビューが選択されたときに呼ばれるコールバック関数を登録する
    if (
      // 同じタブに複数回同じコールバック関数を登録しようとするとエラーが起きるので存在チェックする
      await this.page.evaluate(
        (target) => !(target in window),
        inPageSelectViewCallbackFunctionName,
      )
    ) {
      this.page.exposeFunction(
        inPageSelectViewCallbackFunctionName,
        (viewDisplayName) => {
          this.onViewSelected(viewDisplayName);
        },
      );
    }

    if (
      // 同じタブに複数回同じコールバック関数を登録しようとするとエラーが起きるので存在チェックする
      await this.page.evaluate(
        (target) => !(target in window),
        inPageSearchInputCallbackFunctionName,
      )
    ) {
      this.page.exposeFunction(
        inPageSearchInputCallbackFunctionName,
        (searchQuery) => {
          this.onSearchInput(searchQuery);
        },
      );
    }

    // ページ内にビューの一覧を表示する領域を作る
    this.page.evaluate(
      ([inPageSearchInputCallbackFunctionName, bmViewPreviewViewListId]) => {
        // Reactの管理外に置くため、html要素の直下にDOMノードを置く
        const $sidebar = document.createElement("div");
        $sidebar.setAttribute(
          "class",
          "bg-slate-50 p-4 w-64 space-y-2 h-full overflow-y-auto",
        );

        // ビューのファイルを絞り込むための入力フィールドを作る
        const $searchInput = document.createElement("input");
        $searchInput.setAttribute("type", "text");
        $searchInput.setAttribute("placeholder", "ビューを検索");
        $searchInput.setAttribute("class", "w-full");
        $sidebar.appendChild($searchInput);
        $searchInput.addEventListener("input", (e) => {
          window[inPageSearchInputCallbackFunctionName](e.target.value);
        });

        // ビューのファイル一覧を表示する領域を作る
        const $viewList = document.createElement("div");
        $viewList.setAttribute("id", bmViewPreviewViewListId);
        $viewList.setAttribute("class", "space-y-2");

        $sidebar.appendChild($viewList);
        document.documentElement.appendChild($sidebar);
      },
      [inPageSearchInputCallbackFunctionName, bmViewPreviewViewListId],
    );

    if (selectedViewFileName) {
      this.onViewSelected(selectedViewFileName);
    } else {
      this.updateViewCode(
        `export default () => "プレビューするファイルを選択してください。";`,
      );
    }
  }

  // ページ内のビューの一覧を更新する
  async updateViewList() {
    const filenames = this.#viewList.filter((filename) =>
      filename.includes(this.#searchQuery),
    );

    this.page.evaluate(
      ([filenames, bmViewPreviewViewListId, inPageCallbackFunctionName]) => {
        const $sidebar = document.getElementById(bmViewPreviewViewListId);
        $sidebar.replaceChildren(); // 子要素をすべて消す
        for (const filename of filenames) {
          const $button = document.createElement("button");
          $button.setAttribute(
            "class",
            "p-2 text-left w-full rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900",
          );
          $button.textContent = filename;
          $button.addEventListener("click", () => {
            window[inPageCallbackFunctionName](filename);
          });
          $sidebar.appendChild($button);
        }
      },
      [
        filenames,
        bmViewPreviewViewListId,
        inPageSelectViewCallbackFunctionName,
      ],
    );
  }

  async updateViewCode(code) {
    await this.page.evaluate(
      ({ setCodeEventName, code }) => {
        window.dispatchEvent(
          new CustomEvent(setCodeEventName, { detail: { code } }),
        );
      },
      { setCodeEventName, code },
    );
  }

  onSearchInput(searchQuery) {
    this.setSearchQuery(searchQuery);
    this.updateViewList();
  }
}
