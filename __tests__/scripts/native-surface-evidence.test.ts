import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  NATIVE_EVIDENCE_SCHEMA_VERSION,
  createNativeEvidence,
  formatText,
  parseArgs,
} = require("../../ops/scripts/native-surface-evidence.cjs") as {
  NATIVE_EVIDENCE_SCHEMA_VERSION: string;
  createNativeEvidence: (options?: {
    cwd?: string;
    platform?: NodeJS.Platform;
    commandRunner?: (
      command: string,
      args: string[]
    ) => { readonly status: number | null };
  }) => {
    schema_version: string;
    host: { platform: string };
    repo: {
      package: {
        has_capacitor_script: boolean;
        has_electron_script: boolean;
      };
    };
    surfaces: Array<{
      name: string;
      evidence_tier: string;
      real_package_ready: boolean;
      simulation_project: string | null;
      status: string;
      blocker: string | null;
    }>;
    summary: {
      highest_available_tier: string;
      real_package_ready: boolean;
      simulation_available: boolean;
    };
  };
  formatText: (evidence: ReturnType<typeof createNativeEvidence>) => string;
  parseArgs: (argv: string[]) => Record<string, unknown>;
};

function writeFixtureRepo(
  files: Record<string, string> = {},
  packageJson: Record<string, unknown> = {}
) {
  const cwd = fs.mkdtempSync(
    path.join(os.tmpdir(), "6529-native-surface-evidence-")
  );
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    `${JSON.stringify(
      {
        name: "fixture",
        private: true,
        dependencies: {},
        devDependencies: {},
        scripts: {},
        ...packageJson,
      },
      null,
      2
    )}\n`
  );
  fs.writeFileSync(
    path.join(cwd, "playwright.config.ts"),
    [
      'export default { projects: [{ name: "capacitor-ios-sim" },',
      '{ name: "capacitor-android-sim" }, { name: "electron-shell-sim" }] };',
    ].join(" ")
  );

  for (const [relativePath, text] of Object.entries(files)) {
    const target = path.join(cwd, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }

  return cwd;
}

function commandRunner(availableCommands: readonly string[]) {
  return (command: string) => ({
    status: availableCommands.includes(command) ? 0 : 1,
  });
}

describe("native surface evidence", () => {
  let tempDirs: string[] = [];

  afterEach(() => {
    for (const tempDir of tempDirs) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  function fixture(
    files: Record<string, string> = {},
    packageJson: Record<string, unknown> = {}
  ) {
    const cwd = writeFixtureRepo(files, packageJson);
    tempDirs.push(cwd);
    return cwd;
  }

  it("classifies the current repo as simulation-only unless real package projects exist", () => {
    const evidence = createNativeEvidence({
      cwd: process.cwd(),
      commandRunner: commandRunner([]),
      platform: "win32",
    });

    expect(evidence.schema_version).toBe(NATIVE_EVIDENCE_SCHEMA_VERSION);
    expect(evidence.summary).toMatchObject({
      highest_available_tier: "browser-simulation",
      real_package_ready: false,
      simulation_available: true,
    });
    expect(evidence.repo.package).toMatchObject({
      has_capacitor_script: false,
      has_electron_script: false,
    });
    expect(
      evidence.surfaces.map((surface) => surface.simulation_project)
    ).toEqual([
      "capacitor-ios-sim",
      "capacitor-android-sim",
      "electron-shell-sim",
    ]);
    expect(formatText(evidence)).not.toContain(process.cwd());
  });

  it("requires Android native project files and host tools before claiming real package readiness", () => {
    const cwd = fixture(
      {
        "android/app/build.gradle":
          "plugins { id 'com.android.application' }\n",
        "capacitor.config.ts": "export default {};\n",
      },
      {
        dependencies: { "@capacitor/core": "7.4.1" },
        devDependencies: { "@capacitor/cli": "7.4.1" },
      }
    );

    const evidence = createNativeEvidence({
      cwd,
      commandRunner: commandRunner(["java", "gradle"]),
      platform: "linux",
    });
    const android = evidence.surfaces.find(
      (surface) => surface.name === "capacitor-android"
    );

    expect(android).toMatchObject({
      evidence_tier: "real-package-ready",
      real_package_ready: true,
      status: "ready",
    });
    expect(evidence.summary.highest_available_tier).toBe("real-package-ready");
  });

  it("keeps iOS package evidence blocked on non-macOS hosts", () => {
    const cwd = fixture(
      {
        "capacitor.config.ts": "export default {};\n",
        "ios/App/App.xcodeproj/project.pbxproj": "// fixture\n",
      },
      {
        dependencies: { "@capacitor/core": "7.4.1" },
      }
    );

    const evidence = createNativeEvidence({
      cwd,
      commandRunner: commandRunner(["xcodebuild"]),
      platform: "win32",
    });
    const ios = evidence.surfaces.find(
      (surface) => surface.name === "capacitor-ios"
    );

    expect(ios).toMatchObject({
      evidence_tier: "browser-simulation",
      real_package_ready: false,
      blocker: "iOS package/runtime evidence requires a macOS host",
    });
  });

  it("detects Electron package readiness only with a dependency and main process", () => {
    const cwd = fixture(
      {
        "electron/main.js": "require('electron');\n",
      },
      {
        devDependencies: { electron: "31.0.0" },
        scripts: { "electron:smoke": "electron electron/main.js" },
      }
    );

    const evidence = createNativeEvidence({
      cwd,
      commandRunner: commandRunner([]),
      platform: "win32",
    });
    const electron = evidence.surfaces.find(
      (surface) => surface.name === "electron-shell"
    );

    expect(electron).toMatchObject({
      evidence_tier: "real-package-ready",
      real_package_ready: true,
      status: "ready",
    });
  });

  it("parses boolean and value CLI arguments", () => {
    expect(parseArgs(["--json", "--cwd", "D:/repo"])).toMatchObject({
      json: true,
      cwd: "D:/repo",
    });
  });

  it("fails the CLI when real native evidence is required but absent", () => {
    const script = path.join(
      process.cwd(),
      "ops/scripts/native-surface-evidence.cjs"
    );
    const result = spawnSync(process.execPath, [script, "--require-real"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "real packaged native/Electron evidence is not available"
    );
  });

  it("writes redacted JSON evidence when an output path is provided", () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "6529-native-surface-output-")
    );
    tempDirs.push(outputDir);
    const outputPath = path.join(outputDir, "native-surface-evidence.json");
    const script = path.join(
      process.cwd(),
      "ops/scripts/native-surface-evidence.cjs"
    );

    const result = spawnSync(
      process.execPath,
      [script, "--json", "--output", outputPath, "--require-simulation"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      }
    );
    const evidence = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    expect(result.status).toBe(0);
    expect(evidence.schema_version).toBe(NATIVE_EVIDENCE_SCHEMA_VERSION);
    expect(JSON.stringify(evidence)).not.toContain(process.cwd());
  });
});
