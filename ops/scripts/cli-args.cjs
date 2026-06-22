"use strict";

function parseArgs(argv) {
  const args = { _: [] };
  let index = 0;

  while (index < argv.length) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      index += 1;
      continue;
    }

    const rawKey = token.slice(2);
    const eqIndex = rawKey.indexOf("=");
    if (eqIndex !== -1) {
      args[rawKey.slice(0, eqIndex)] = rawKey.slice(eqIndex + 1);
      index += 1;
      continue;
    }

    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith("--")) {
      args[rawKey] = true;
      index += 1;
      continue;
    }

    args[rawKey] = nextToken;
    index += 2;
  }

  return args;
}

module.exports = {
  parseArgs,
};
