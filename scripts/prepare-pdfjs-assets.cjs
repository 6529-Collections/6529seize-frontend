const fs = require("node:fs");
const path = require("node:path");

const packageFile = require.resolve("pdfjs-dist/package.json");
const source = path.dirname(packageFile);
const { version } = require(packageFile);
const destination = path.join(__dirname, "..", "public", "pdfjs", version);

// Same-origin assets work with the existing CSP and with the production asset
// prefix, without executing a worker supplied by an external CDN.
fs.mkdirSync(destination, { recursive: true });
fs.copyFileSync(
  path.join(source, "legacy", "build", "pdf.worker.min.mjs"),
  path.join(destination, "pdf.worker.min.mjs")
);
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  fs.cpSync(path.join(source, directory), path.join(destination, directory), {
    recursive: true,
  });
}
