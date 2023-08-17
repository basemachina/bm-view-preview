class ViewPage {
  constructor(page, watcher) {
    this.page = page;
    this.watcher = watcher;
  }

  static connect(page, watcher) {
    const viewPage = new ViewPage(page, watcher);
    viewPage.start();
  }

  async start() {
    const updateViewCode = (code) => {
      const editor = monaco?.editor?.getEditors()?.[0];
      if (editor) {
        editor.setValue(code);
      }
    };

    for (;;) {
      const { value } = await this.watcher.next();
      await this.page.evaluate(updateViewCode, value);
    }
  }
}

module.exports = {
  ViewPage,
};
