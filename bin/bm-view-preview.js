#!/usr/bin/env node

import { getOptions } from "../lib/getOptions.js";
import { run } from "../lib/run.js";

try {
  const options = await getOptions();
  await run(options);
} catch (error) {
  console.error(`エラーが発生しました: ${error?.message ?? error}`);
  process.exit(1);
}
