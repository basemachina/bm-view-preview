import path from "node:path";
import { cosmiconfigSync } from "cosmiconfig";

export const getOptions = () => {
  const result = cosmiconfigSync("bm-view-preview", {
    searchPlaces: ["bm-view-preview.config.json"],
  }).search();
  if (!result) {
    throw new Error("設定ファイルがありません");
  }
  return {
    ...result.config,
    sourceDir: path.resolve(
      path.dirname(result.filepath),
      result.config.sourceDir
    ),
  };
};
