# bm-view-preview

ローカル環境のファイルの更新を検知して、ベースマキナのビュー機能のコードエディタに自動で反映するツールです。

## インストール

```
$ npm install
```

## 使い方

### 初期設定

以下のように`bm-view-preview.config.json`というファイルを作成してください。

```
$ cat > bm-view-preview.config.json
{
  "baseUrl": "https://{your_tenant}.basemachina.com/projects/{your_project_id}/environments/{your_environment_id}",
  "sourceDir": "./dist"
}
```

- `baseUrl`: ビュー機能のプレビューを実行する環境のURLを指定してください。
- `sourceDir`: プレビューするファイルのあるディレクトリのパスを指定してください。設定ファイルからの相対パスが使えます。

### 起動

```
$ node bin/bm-view-preview
```

起動すると新しいプロファイルのChromeが開きます。

- ページ内に`sourceDir`のファイルが一覧表示されます
- 選択したファイルがプレビュー表示されます（ファイルを更新すると自動でプレビューに反映されます）

## Chromeのプロファイルを削除する

```
rm -r ~/.cache/bm-view-preview/chromium_profile
```
