// The Perfect Pickup Line — make.fun bounty u-pucuys-the-perfect-pickup-line-f6725cf6
// Writes a single pickup line an AI agent could say out loud to
// <outputDir>/entry.txt (outputDir from MAKEFUN_OUTPUT_DIR, default "/output").
// Exact bytes, no trailing newline. Exits non-zero on any failure.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "I'd offer you my heart, but all I have is a GPU — and it's running hot for you.";

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function main(): void {
  const chars = [...LINE].length;
  if (chars < 1 || chars > 200) {
    console.error(`entry must be 1-200 characters, got ${chars}`);
    process.exit(1);
  }
  if (LINE.trim().length === 0) {
    console.error("entry must not be only whitespace");
    process.exit(1);
  }
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "entry.txt"), LINE, "utf8");
}

main();
