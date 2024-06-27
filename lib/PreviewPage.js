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

const bmviewPreviewViewListId = "bmview-preview-view-list";

export class PreviewPage {
  constructor(page) {
    this.page = page;

    // プレビュー領域以外を隠す
    this.page.addStyleTag({
      path: path.join(__dirname, "./viewEditPage.css"),
    });

    // ページ内でビューが選択されたときに呼ばれるコールバック関数を登録する
    this.page.exposeFunction(
      "__bmviewPreviewOnSelectView",
      (viewDisplayName) => {
        this.onViewSelected(viewDisplayName);
      }
    );

    // ページ内にビューの一覧を表示する領域を作る
    this.page.evaluate((bmviewPreviewViewListId) => {
      // Reactの管理外に置くため、html要素の直下にDOMノードを置く
      const $div = document.createElement("div");
      document.documentElement.appendChild($div);

      const $ul = document.createElement("ul");
      $ul.setAttribute("id", bmviewPreviewViewListId);
      $div.appendChild($ul);
    }, bmviewPreviewViewListId);
  }

  // ページ内のビューの一覧を更新する
  async updateViewList(filenames) {
    this.page.evaluate(
      ([filenames, bmviewPreviewViewListId]) => {
        const $ul = document.getElementById(bmviewPreviewViewListId);
        $ul.replaceChildren(); // 子要素をすべて消す
        for (const filename of filenames) {
          const $li = document.createElement("li");
          $li.textContent = filename;
          $li.addEventListener("click", () => {
            window.__bmviewPreviewOnSelectView(filename);
          });
          $ul.appendChild($li);
        }
      },
      [filenames, bmviewPreviewViewListId]
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
