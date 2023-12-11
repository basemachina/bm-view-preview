# bmview-preview

ローカル環境のファイルの更新を検知して、ベースマキナのビュー機能のコードエディタに自動で反映するツールです。

## インストール

```
$ npm install
```

## 使い方

```
$ node main.js {your_view_file.js}
```

新しいプロファイルのChromeが開くので、BaseMachinaにログインして、`/views/new`にアクセスしてからリロードしてください。

起動時に指定したファイルを更新するたびに、ブラウザ上のコードエディタに自動でコードが反映され、プレビューを確認することができます。
