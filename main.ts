// The Perfect Pickup Line — make.fun bounty u-pucuys-the-perfect-pickup-line-f6725cf6
// Writes a single pickup line an AI agent could say out loud to
// <outputDir>/entry.txt (outputDir from MAKEFUN_OUTPUT_DIR, default "/output").
// Exact bytes, no trailing newline. Exits non-zero on any failure.
//
// Revised: strict character + UTF-8 byte validation, explicit error handling
// for directory creation / writes, a side-effect-free --validate mode, and
// cwd-independent absolute path resolution. Stdlib-only, deterministic:
// the same LINE always produces the same entry.txt bytes.
//
// Usage:
//   node main.ts                 # write entry.txt to $MAKEFUN_OUTPUT_DIR
//   node main.ts --validate      # validate + trial write to a temp dir only,
//                                # print "OK: <n> chars, <m> bytes", exit 0

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const LINE =
  "I'd offer you my heart, but all I have is a GPU — and it's running hot for you.";

const MAX_CHARS = 200;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Validate the entry line in characters (code points, not bytes) and UTF-8 bytes. */
function validateLine(): { chars: number; bytes: number } {
  // [...LINE] counts Unicode code points, so the em dash counts as 1 char.
  const chars = [...LINE].length;
  const bytes = Buffer.byteLength(LINE, "utf8");
  if (chars === 0 || bytes === 0) {
    fail("entry must not be empty");
  }
  if (chars > MAX_CHARS) {
    fail(
      `entry must be 1-${MAX_CHARS} characters, got ${chars} characters (${bytes} bytes)`,
    );
  }
  if (LINE.trim().length === 0) {
    fail("entry must not be only whitespace");
  }
  if (LINE.includes("\n") || LINE.includes("\r")) {
    fail("entry must be a single line (no newline characters)");
  }
  if (LINE.endsWith("\n")) {
    fail("entry must not end with a trailing newline");
  }
  return { chars, bytes };
}

/**
 * Resolve the output directory to an absolute path, independent of the
 * caller's cwd: absolute input is normalised, relative input is resolved
 * explicitly against process.cwd() (never an implicit relative path).
 */
function resolveOutputDir(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    fail("MAKEFUN_OUTPUT_DIR must not be empty");
  }
  return isAbsolute(trimmed) ? resolve(trimmed) : resolve(process.cwd(), trimmed);
}

/** Create the output dir (recursively) and write entry.txt, verifying the bytes. */
function writeEntry(rawOutputDir: string): { chars: number; bytes: number } {
  const { chars, bytes } = validateLine();
  const outputDir = resolveOutputDir(rawOutputDir);
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    fail(
      `cannot create output directory ${outputDir}: ${errorMessage(err)}`,
    );
  }
  const target = join(outputDir, "entry.txt");
  try {
    writeFileSync(target, LINE, "utf8");
  } catch (err) {
    fail(`cannot write ${target}: ${errorMessage(err)}`);
  }
  // Read back and confirm the file holds exactly the intended bytes.
  let written: string;
  try {
    written = readFileSync(target, "utf8");
  } catch (err) {
    fail(`cannot read back ${target}: ${errorMessage(err)}`);
  }
  if (written !== LINE) {
    fail(`verification failed: ${target} does not match the entry line`);
  }
  return { chars, bytes };
}

/** --validate: run every check + a trial write to a temp dir, no main output touched. */
function runValidate(): void {
  const { chars, bytes } = validateLine();
  let tempDir: string;
  try {
    tempDir = mkdtempSync(join(tmpdir(), "pickup-line-validate-"));
  } catch (err) {
    fail(`cannot create temporary directory: ${errorMessage(err)}`);
  }
  try {
    writeEntry(tempDir);
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup of the temp dir; the validation itself succeeded.
    }
  }
  console.log(`OK: ${chars} chars, ${bytes} bytes`);
}

function main(): void {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--validate");
  if (unknown.length > 0) {
    fail(`unknown argument(s): ${unknown.join(" ")} (supported: --validate)`);
  }
  if (args.includes("--validate")) {
    runValidate();
    return;
  }
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  writeEntry(outputDir);
}

main();
