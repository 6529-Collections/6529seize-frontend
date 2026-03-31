const requiredPackageManager = "pnpm@10.15.1";
const userAgent = process.env.npm_config_user_agent ?? "";

if (userAgent.startsWith("pnpm/")) {
  process.exit(0);
}

console.error("This repository is managed with pnpm only.");
console.error(`Install ${requiredPackageManager} and run "pnpm install".`);
console.error(
  'Recommended bootstrap: "corepack enable pnpm" then "corepack use pnpm@10.15.1".'
);
process.exit(1);
