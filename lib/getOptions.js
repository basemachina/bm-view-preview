import { env } from "node:process";

export const getOptions = (args) => {
  return {
    // TODO: baseUrlをカレントディレクトリの設定ファイル（bmview-preview.cjsみたいなやつ）から取得する
    baseUrl: env.BMVIEW_PREVIEW_BASE_URL,
    viewSourceFilePath: args[0],
  };
};
