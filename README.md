# bmview-preview

ローカル環境のファイルの更新を検知して、ベースマキナのビュー機能のコードエディタに自動で反映するツールです。

## インストール

```
$ npm install
```

## 使い方

```
$ export BMVIEW_PREVIEW_BASE_URL=https://{your_tenant}.basemachina.com/projects/{your_project_id}/environments/{your_environment_id}
$ node bin/bmview-preview {your_view_file.js}
```

起動すると新しいプロファイルのChromeが開きます。

起動時に指定したファイルを更新するたびに、ブラウザ上のコードエディタに自動でコードが反映され、プレビューを確認することができます。

## Chromeのプロファイルを削除する

```
rm -r ~/.cache/bmview-preview/chromium_profile
```
