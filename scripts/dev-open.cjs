// dev-open.cjs
const { spawn } = require("node:child_process");

let openModulePromise;
let browserOpened = false;
const SKIP_BROWSER_OPEN = process.env.SKIP_BROWSER_OPEN === "true";

function getOpenModule() {
  if (!openModulePromise) {
    openModulePromise = import("open").then((module) => module.default);
  }

  return openModulePromise;
}

const proc = spawn("npm", ["run", "dev"], { stdio: ["inherit", "pipe", "inherit"] });

proc.on("error", (error) => {
  console.error("Failed to start dev server:", error);
  process.exit(1);
});

proc.on("close", (code) => {
  if (code !== 0) {
    console.error(`Dev server exited with code ${code}`);
  }
  process.exit(code || 0);
});

// Forward termination signals to child process
process.on("SIGINT", () => {
  proc.kill("SIGINT");
});

process.on("SIGTERM", () => {
  proc.kill("SIGTERM");
});

proc.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text); // still show logs normally

  const match = text.match(/http:\/\/localhost:\d+(?:\/[^\s]*)?/);
  if (match && !browserOpened && !SKIP_BROWSER_OPEN) {
    browserOpened = true;
    console.log(`🌐 Opening browser at: ${match[0]}`);
    getOpenModule()
      .then((open) => open(match[0]))
      .catch((error) => {
        console.error("Failed to open browser automatically:", error);
      });
  }
});
