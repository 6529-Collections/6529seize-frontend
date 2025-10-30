// dev-open.js
import { spawn } from "child_process";
import open from "open";

const proc = spawn("npm", ["run", "dev"], { stdio: ["inherit", "pipe", "inherit"] });

proc.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text); // still show logs normally

  const match = text.match(/http:\/\/localhost:\d+(?:\/[^\s]*)?/);
  if (match) {
    console.log(`🌐 Opening browser at: ${match[0]}`);
    open(match[0]);
  }
});
