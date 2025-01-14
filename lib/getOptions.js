import path from "node:path";
import { cosmiconfig } from "cosmiconfig";

export const getOptions = async () => {
  const result = await cosmiconfig("bm-view-preview", {
    searchPlaces: [
      "bm-view-preview.config.json",
      "bm-view-preview.config.cjs",
      "bm-view-preview.config.js",
      "bm-view-preview.config.ts",
      "bm-view-preview.config.mjs",
    ],
  }).search();
  if (!result) {
    throw new Error("設定ファイルがありません");
  }
  return {
    ...result.config,
    sourceDir: path.resolve(
      path.dirname(result.filepath),
      result.config.sourceDir,
    ),
  };
};
