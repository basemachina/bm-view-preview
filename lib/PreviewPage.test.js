import { describe, expect, test } from "vitest";
import { isNewViewPage } from "./PreviewPage";

describe("isNewViewPage ", () => {
  test.each([
    {
      url: "https://demo.basemachina.com/projects/PROJECT_ID/environments/ENVIRONMENT_ID/actions/new",
      expected: false,
    },
    {
      url: "https://demo.basemachina.com/projects/PROJECT_ID/environments/ENVIRONMENT_ID/views/new",
      expected: true,
    },

    // BaseMachina開発チームのローカル環境などでも動作させるため、ドメイン名は検証していない
    {
      url: "https://example.com/projects/PROJECT_ID/environments/ENVIRONMENT_ID/views/new",
      expected: true,
    },
  ])("isNewViewPage($url) -> $expected", ({ url, expected }) => {
    expect(isNewViewPage(url)).toBe(expected);
  });
});
