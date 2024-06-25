import path from "path";
import { fileURLToPath } from "url";

// ref. https://teno-hira.com/media/?p=1615
const __dirname = (() => {
  const __filename = fileURLToPath(import.meta.url);
  return path.dirname(__filename);
})();

export const isNewViewPage = (url) => {
  const { pathname } = new URL(url);
  return new RegExp("^/projects/[^/]+/environments/[^/]+/views/new$").test(
    pathname
  );
};

export class ViewPage {
  constructor(page, watcher) {
    this.page = page;
    this.watcher = watcher;
  }

  static connect(page, watcher) {
    const viewPage = new ViewPage(page, watcher);
    viewPage.start();
  }

  async start() {
    // プレビュー領域以外を隠す
    this.page.addStyleTag({
      path: path.join(__dirname, "./viewEditPage.css"),
    });

    this.page.exposeFunction("__bmviewPreviewOnClick", (arg) => {
      console.log(arg);
    });

    this.page.evaluate(() => {
      const $div = document.createElement("div");
      $div.textContent = "init";
      $div.addEventListener("click", () =>
        window.__bmviewPreviewOnClick(`${new Date()}`)
      );
      document.documentElement.appendChild($div);

      window.__bmviewPreviewShowMessage = (msg) => ($div.textContent = msg);
    });

    setInterval(() => {
      this.page.evaluate(() => {
        window.__bmviewPreviewShowMessage(new Date());
      });
    }, 500);

    // monacoがロードされるまで待つ
    await this.page.waitForFunction(
      () => window.monaco?.editor?.getEditors()?.[0],
      null,
      {
        polling: 100, // 100ms
        timeout: 0, // disable timeout
      }
    );

    // ファイルが変更されるたびにmonacoに入力する
    for (;;) {
      const { value } = await this.watcher.next();
      await this.page.evaluate((code) => {
        const editor = window.monaco.editor.getEditors()[0];
        editor.setValue(code);
      }, value);
    }
  }
}
