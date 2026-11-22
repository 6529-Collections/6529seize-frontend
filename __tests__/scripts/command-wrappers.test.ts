import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The repo command wrappers (bin/6529, bin/pnpm) search PATH for the real pnpm.
 * PATH can hold this checkout's wrapper folder in more than one spelling, and
 * the wrapper folders of other checkouts. Every case here must end within
 * seconds, with the real pnpm or with a clear error: a wrapper must never start
 * a wrapper.
 */

const root = process.cwd();
const isWindows = process.platform === "win32";
const RUN_TIMEOUT_MS = 30_000;

function findBash(): string {
  if (!isWindows) {
    return "bash";
  }
  const candidates = [
    path.join(
      process.env["ProgramFiles"] ?? "C:\\Program Files",
      "Git",
      "bin",
      "bash.exe"
    ),
    path.join(
      process.env["ProgramFiles"] ?? "C:\\Program Files",
      "Git",
      "usr",
      "bin",
      "bash.exe"
    ),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? "bash";
}

const bash = findBash();

function systemPathEntries(): string[] {
  if (!isWindows) {
    return ["/usr/bin", "/bin"];
  }
  const gitRoot = path.resolve(path.dirname(bash), "..");
  return [path.join(gitRoot, "usr", "bin"), path.join(gitRoot, "bin")].filter(
    (entry) => fs.existsSync(entry)
  );
}

let sandbox: string;
let realDir: string;

function makeCheckout(name: string, source: "current" | "previous"): string {
  const checkout = path.join(sandbox, name);
  const binDir = path.join(checkout, "bin");
  fs.mkdirSync(binDir, { recursive: true });
  if (source === "current") {
    for (const file of ["6529", "pnpm", "wrapper-lib.sh"]) {
      fs.copyFileSync(path.join(root, "bin", file), path.join(binDir, file));
      fs.chmodSync(path.join(binDir, file), 0o755);
    }
  } else {
    // The pnpm wrapper as it was before the wrappers learned to skip each
    // other: it removes one exact spelling of its own folder from PATH and
    // starts whatever "pnpm" it finds next. Checkouts made before this change
    // still carry it.
    fs.writeFileSync(
      path.join(binDir, "pnpm"),
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
        'if [[ "${SEIZE_6529_COMMAND:-0}" != "1" ]]; then',
        '  echo "Direct pnpm usage is blocked in this repository." >&2',
        "  exit 1",
        "fi",
        'clean_path=""',
        "IFS=':' read -r -a path_parts <<< \"${PATH:-}\"",
        'for part in "${path_parts[@]}"; do',
        '  if [[ -z "$part" || "$part" == "$SCRIPT_DIR" ]]; then continue; fi',
        '  clean_path="${clean_path:+${clean_path}:}$part"',
        "done",
        'REAL_PNPM="$(PATH="$clean_path" command -v pnpm || true)"',
        'if [[ -z "$REAL_PNPM" ]]; then exit 1; fi',
        'exec "$REAL_PNPM" "$@"',
        "",
      ].join("\n")
    );
    fs.chmodSync(path.join(binDir, "pnpm"), 0o755);
  }
  return binDir;
}

function run(
  script: string,
  args: string[],
  pathEntries: string[],
  env: Record<string, string> = {}
) {
  const result = childProcess.spawnSync(bash, [script, ...args], {
    cwd: sandbox,
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MS,
    killSignal: "SIGKILL",
    env: {
      PATH: [...pathEntries, ...systemPathEntries()].join(path.delimiter),
      HOME: sandbox,
      SEIZE_6529_COMMAND: "1",
      ...env,
    },
  });
  const spawnError = result.error as NodeJS.ErrnoException | undefined;
  if (spawnError !== undefined && spawnError.code !== "ETIMEDOUT") {
    // bash missing or not startable: a setup problem, not a wrapper result.
    throw spawnError;
  }
  return {
    status: result.status,
    timedOut: spawnError?.code === "ETIMEDOUT",
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

beforeAll(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "command-wrappers-"));
  realDir = path.join(sandbox, "real");
  fs.mkdirSync(realDir);
  fs.writeFileSync(
    path.join(realDir, "pnpm"),
    '#!/usr/bin/env bash\necho "REAL pnpm $*"\n'
  );
  fs.chmodSync(path.join(realDir, "pnpm"), 0o755);
});

afterAll(() => {
  fs.rmSync(sandbox, { recursive: true, force: true });
});

describe("repo command wrappers", () => {
  it("reach the real pnpm when two checkouts have their wrapper folders on PATH", () => {
    const first = makeCheckout("two-a", "current");
    const second = makeCheckout("two-b", "current");

    const result = run(
      path.join(first, "pnpm"),
      ["--version"],
      [first, second, realDir]
    );

    expect(result.timedOut).toBe(false);
    expect(result.stdout.trim()).toBe("REAL pnpm --version");
    expect(result.status).toBe(0);
  });

  it("reach the real pnpm through 6529 run with two wrapper folders on PATH", () => {
    const first = makeCheckout("run-a", "current");
    const second = makeCheckout("run-b", "current");

    const result = run(
      path.join(first, "6529"),
      ["run", "hello"],
      [second, first, realDir]
    );

    expect(result.timedOut).toBe(false);
    expect(result.stdout.trim()).toBe("REAL pnpm run hello");
    expect(result.status).toBe(0);
  });

  it("skip their own folder when PATH spells it with a trailing separator", () => {
    const own = makeCheckout("trailing", "current");

    const result = run(
      path.join(own, "pnpm"),
      ["--version"],
      [`${own}${path.sep}`, realDir]
    );

    expect(result.timedOut).toBe(false);
    expect(result.stdout.trim()).toBe("REAL pnpm --version");
    expect(result.status).toBe(0);
  });

  it("skip their own folder when PATH reaches it through a link", () => {
    const own = makeCheckout("linked", "current");
    const link = path.join(sandbox, "linked-bin");
    try {
      fs.symlinkSync(own, link, isWindows ? "junction" : "dir");
    } catch {
      // No permission to create links here: nothing to check.
      return;
    }

    const result = run(path.join(own, "pnpm"), ["--version"], [link, realDir]);

    expect(result.timedOut).toBe(false);
    expect(result.stdout.trim()).toBe("REAL pnpm --version");
    expect(result.status).toBe(0);
  });

  it("skip the wrapper of a checkout that still has the previous version", () => {
    const current = makeCheckout("mixed-new", "current");
    const previous = makeCheckout("mixed-old", "previous");

    const fromCurrent = run(
      path.join(current, "pnpm"),
      ["--version"],
      [current, previous, realDir]
    );
    const fromPrevious = run(
      path.join(previous, "pnpm"),
      ["--version"],
      [previous, current, realDir]
    );

    for (const result of [fromCurrent, fromPrevious]) {
      expect(result.timedOut).toBe(false);
      expect(result.stdout.trim()).toBe("REAL pnpm --version");
      expect(result.status).toBe(0);
    }
  });

  it("stop with an error when PATH holds only wrappers", () => {
    const first = makeCheckout("only-a", "current");
    const second = makeCheckout("only-b", "current");

    const result = run(
      path.join(first, "pnpm"),
      ["--version"],
      [first, second]
    );

    expect(result.timedOut).toBe(false);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unable to locate the real pnpm binary");
    expect(result.stdout).toBe("");
  });

  it.each(["pnpm", "6529"])(
    "stop %s when the chain of wrapper starts is too deep",
    (wrapper) => {
      const own = makeCheckout(`deep-${wrapper}`, "current");
      const args = wrapper === "6529" ? ["run", "hello"] : ["--version"];

      const result = run(path.join(own, wrapper), args, [own, realDir], {
        SEIZE_WRAPPER_DEPTH: "32",
      });

      expect(result.timedOut).toBe(false);
      expect(result.status).toBe(97);
      expect(result.stderr).toContain("started 32 times");
      expect(result.stdout).toBe("");
    }
  );

  it("count each wrapper start for the commands it runs", () => {
    const own = makeCheckout("count", "current");
    fs.writeFileSync(
      path.join(realDir, "pnpm-depth"),
      '#!/usr/bin/env bash\necho "depth ${SEIZE_WRAPPER_DEPTH:-unset}"\n'
    );
    const countingDir = path.join(sandbox, "counting");
    fs.mkdirSync(countingDir);
    fs.copyFileSync(
      path.join(realDir, "pnpm-depth"),
      path.join(countingDir, "pnpm")
    );
    fs.chmodSync(path.join(countingDir, "pnpm"), 0o755);

    const result = run(path.join(own, "pnpm"), [], [own, countingDir], {
      SEIZE_WRAPPER_DEPTH: "4",
    });

    expect(result.stdout.trim()).toBe("depth 5");
    expect(result.status).toBe(0);
  });

  it("stay far below the limit when a script starts pnpm again", () => {
    // What package.json scripts do: the real pnpm runs a script, and the
    // script calls "pnpm" again, which is the wrapper because the wrapper
    // folder is first on PATH.
    const own = makeCheckout("nested", "current");
    const nestingDir = path.join(sandbox, "nesting");
    fs.mkdirSync(nestingDir);
    fs.writeFileSync(
      path.join(nestingDir, "pnpm"),
      [
        "#!/usr/bin/env bash",
        'if [[ "${1:-}" == "nest" ]]; then',
        "  exec pnpm report",
        "fi",
        'echo "depth ${SEIZE_WRAPPER_DEPTH:-unset}"',
        "",
      ].join("\n")
    );
    fs.chmodSync(path.join(nestingDir, "pnpm"), 0o755);

    const result = run(path.join(own, "pnpm"), ["nest"], [own, nestingDir]);

    expect(result.timedOut).toBe(false);
    expect(result.stdout.trim()).toBe("depth 2");
    expect(result.status).toBe(0);
  });

  it("do not mistake another tool that mentions the same words for a wrapper", () => {
    const own = makeCheckout("lookalike", "current");
    const toolDir = path.join(sandbox, "lookalike-tool");
    fs.mkdirSync(toolDir);
    fs.writeFileSync(
      path.join(toolDir, "pnpm"),
      [
        "#!/usr/bin/env bash",
        "# Notes: 6529-repo-command-wrapper is the marker the repo wrappers use.",
        "# Direct pnpm usage is blocked in this repository. (quoted from its docs)",
        'echo "TOOL pnpm $*"',
        "",
      ].join("\n")
    );
    fs.chmodSync(path.join(toolDir, "pnpm"), 0o755);

    const result = run(path.join(own, "pnpm"), ["--version"], [own, toolDir]);

    expect(result.stdout.trim()).toBe("TOOL pnpm --version");
    expect(result.status).toBe(0);
  });

  it("keep blocking pnpm when it is not started through 6529", () => {
    const own = makeCheckout("blocked", "current");

    const result = run(path.join(own, "pnpm"), ["--version"], [own, realDir], {
      SEIZE_6529_COMMAND: "0",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Direct pnpm usage is blocked");
    expect(result.stdout).toBe("");
  });
});
