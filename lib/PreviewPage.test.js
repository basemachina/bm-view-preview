import { describe, expect, test } from "vitest";
import { isBmViewPreviewPage } from "./PreviewPage";

describe("isBmViewPreviewPage  ", () => {
  test.each([
    {
      url: "https://demo.basemachina.com/projects/PROJECT_ID/environments/ENVIRONMENT_ID/actions/bm-view-preview",
      expected: false,
    },
    {
      url: "https://demo.basemachina.com/projects/PROJECT_ID/environments/ENVIRONMENT_ID/views/bm-view-preview",
      expected: true,
    },

    // BaseMachina開発チームのローカル環境などでも動作させるため、ドメイン名は検証していない
    {
      url: "https://example.com/projects/PROJECT_ID/environments/ENVIRONMENT_ID/views/bm-view-preview",
      expected: true,
    },
  ])("isBmViewPreviewPage ($url) -> $expected", ({ url, expected }) => {
    expect(isBmViewPreviewPage(url)).toBe(expected);
  });
});
