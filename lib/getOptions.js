import path from "node:path";
import { cosmiconfigSync } from "cosmiconfig";

export const getOptions = () => {
  const result = cosmiconfigSync("bmview-preview", {
    searchPlaces: ["bmview-preview.config.json"],
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
