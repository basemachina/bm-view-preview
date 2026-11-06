import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { resolveUniquePath, saveDownload } from "./downloads";

let dir;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "bm-view-preview-downloads-"));
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("resolveUniquePath", () => {
  test("同名のファイルが無ければそのまま使う", async () => {
    expect(await resolveUniquePath(dir, "data.csv")).toBe(
      path.join(dir, "data.csv"),
    );
  });

  test("同名のファイルがあれば連番を付ける", async () => {
    await fs.writeFile(path.join(dir, "data.csv"), "");
    await fs.writeFile(path.join(dir, "data (1).csv"), "");
    expect(await resolveUniquePath(dir, "data.csv")).toBe(
      path.join(dir, "data (2).csv"),
    );
  });

  test("拡張子が無いファイル名にも連番を付ける", async () => {
    await fs.writeFile(path.join(dir, "data"), "");
    expect(await resolveUniquePath(dir, "data")).toBe(
      path.join(dir, "data (1)"),
    );
  });
});

describe("saveDownload", () => {
  const fakeDownload = (suggestedFilename, content) => ({
    suggestedFilename: () => suggestedFilename,
    saveAs: (savePath) => fs.writeFile(savePath, content),
  });

  test("ページが指定したファイル名で保存する", async () => {
    const savePath = await saveDownload(
      fakeDownload("当期入金データ_20261106120000.csv", "a,b"),
      dir,
    );
    expect(savePath).toBe(path.join(dir, "当期入金データ_20261106120000.csv"));
    expect(await fs.readFile(savePath, "utf8")).toBe("a,b");
  });

  test("保存先のディレクトリが無ければ作る", async () => {
    const nested = path.join(dir, "nested");
    const savePath = await saveDownload(fakeDownload("a.csv", ""), nested);
    expect(savePath).toBe(path.join(nested, "a.csv"));
  });
});
