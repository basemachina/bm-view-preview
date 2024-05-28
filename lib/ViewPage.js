export const isViewPage = (url) => {
  const { pathname } = new URL(url);
  const newPageRegExp = new RegExp(
    "^/projects/[^/]+/environments/[^/]+/views/new$"
  );
  const editPageRegExp = new RegExp(
    "^/projects/[^/]+/environments/[^/]+/views/[^/]+/edit$"
  );
  return newPageRegExp.exec(pathname) || editPageRegExp.exec(pathname);
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
