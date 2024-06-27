import { env } from "node:process";

// TODO: 別ファイルに切り出す必要ないかも
export const getOptions = () => {
  return {
    // TODO: baseUrlをカレントディレクトリの設定ファイル（bmview-preview.cjsみたいなやつ）から取得する
    baseUrl: env.BMVIEW_PREVIEW_BASE_URL,
  };
};
