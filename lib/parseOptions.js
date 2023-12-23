import { parseArgs } from "node:util";

export const parseOptions = (args) => {
  const { values, positionals } = parseArgs({
    args,
    options: {
      url: {
        type: "string",
      },
    },
    allowPositionals: true,
  });
  return {
    ...values,
    viewSourceFilePath: positionals[0],
  };
};
