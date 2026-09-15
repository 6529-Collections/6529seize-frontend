#!/usr/bin/env node

const fs = require("node:fs");

function isValidEthereumRpcUrl(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

if (require.main === module) {
  const value = fs.readFileSync(0, "utf8");
  if (!isValidEthereumRpcUrl(value)) {
    console.error("ETHEREUM_RPC_URL must be a complete HTTP(S) URL.");
    process.exitCode = 1;
  }
}

module.exports = { isValidEthereumRpcUrl };
