// dev-open.cjs
const { spawn } = require("node:child_process");

let openModulePromise;

function getOpenModule() {
  if (!openModulePromise) {
    openModulePromise = import("open").then((module) => module.default);
  }

  return openModulePromise;
}

const proc = spawn("npm", ["run", "dev"], { stdio: ["inherit", "pipe", "inherit"] });

proc.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text); // still show logs normally

  const match = text.match(/http:\/\/localhost:\d+(?:\/[^\s]*)?/);
  if (match) {
    console.log(`🌐 Opening browser at: ${match[0]}`);
    getOpenModule()
      .then((open) => open(match[0]))
      .catch((error) => {
        console.error("Failed to open browser automatically:", error);
      });
  }
});
