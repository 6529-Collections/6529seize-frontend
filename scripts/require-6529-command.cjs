#!/usr/bin/env node

if (process.env["SEIZE_6529_COMMAND"] !== "1") {
  console.error("This repository only allows repo commands through the `6529` wrapper.");
  console.error("Use one of:");
  console.error("  6529 run dev");
  console.error("  6529 run build");
  console.error("  6529 run test");
  console.error("  6529 run lint");
  console.error("  6529 install");
  console.error("  6529 run start");
  console.error("  6529 staging");
  process.exit(1);
}
