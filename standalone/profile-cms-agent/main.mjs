#!/usr/bin/env node
import schemas from "./schemas.json" with { type: "json" };
import { createAgentApi } from "./api.mjs";
import { createToolHandler } from "./tools.mjs";
import { startStdioServer } from "./server.mjs";

async function main() {
  if (Number(process.versions.node.split(".")[0]) < 22)
    throw new Error("Node.js 22 or newer is required.");
  const api = createAgentApi({
    environment: process.env.CMS_AGENT_ENV,
    token: process.env.CMS_AGENT_TOKEN,
    stagingApiKey: process.env.CMS_AGENT_STAGING_API_KEY,
  });
  startStdioServer({
    input: process.stdin,
    output: process.stdout,
    callTool: createToolHandler(api, schemas),
  });
}

main().catch(() => {
  process.stderr.write(
    "6529 CMS adapter could not start. Check Node.js 22+, the extracted files and CMS_AGENT_ENV (production or staging). Credentials and website content were not logged.\n"
  );
  process.exitCode = 1;
});
