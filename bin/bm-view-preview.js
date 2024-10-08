#!/usr/bin/env node

import { getOptions } from "../lib/getOptions.js";
import { run } from "../lib/run.js";

const options = await getOptions();
run(options);
