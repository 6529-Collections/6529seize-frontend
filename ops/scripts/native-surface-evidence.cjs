#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const NATIVE_EVIDENCE_SCHEMA_VERSION = "frontend-testing.native-evidence.v1";
const CAPACITOR_SIM_PROJECTS = {
  "capacitor-ios": "capacitor-ios-sim",
  "capacitor-android": "capacitor-android-sim",
};
const ELECTRON_SIM_PROJECT = "electron-shell-sim";

function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const rawKey = token.slice(2);
    const equalsIndex = rawKey.indexOf("=");
    if (equalsIndex !== -1) {
      args[rawKey.slice(0, equalsIndex)] = rawKey.slice(equalsIndex + 1);
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[rawKey] = true;
      continue;
    }

    args[rawKey] = next;
    index += 1;
  }

  return args;
}

function exists(cwd, relativePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI probes repo-relative native project candidates under --cwd.
  return fs.existsSync(path.join(cwd, relativePath));
}

function existingFiles(cwd, candidates) {
  return candidates.filter((candidate) => exists(cwd, candidate));
}

function readPackageJson(cwd) {
  try {
    return JSON.parse(readRepoTextFile(cwd, "package.json"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        "native evidence input invalid: package.json is not JSON"
      );
    }
    throw error;
  }
}

function readRepoTextFile(cwd, relativePath) {
  try {
    const target = path.join(cwd, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI reads required repo-local files under --cwd.
    return fs.readFileSync(target, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`native evidence input missing: ${relativePath}`);
    }
    throw new Error(
      `native evidence input unreadable: ${relativePath}: ${error.message}`
    );
  }
}

function dependencyVersion(packageJson, name) {
  return (
    packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name]
  );
}

function hasDependency(packageJson, name) {
  return dependencyVersion(packageJson, name) !== undefined;
}

function hasScriptCommand(packageJson, pattern) {
  return Object.values(packageJson.scripts ?? {}).some(
    (script) => typeof script === "string" && pattern.test(script)
  );
}

function hasCapacitorPackageScript(packageJson) {
  return hasScriptCommand(
    packageJson,
    /(^|[;&|]\s*)(?:pnpm exec |npx |node_modules\/\.bin\/)?(?:cap|capacitor)(?:\.cmd)?\s+(?:sync|copy|add|build|run|open)\b/i
  );
}

function hasElectronPackageScript(packageJson) {
  return hasScriptCommand(
    packageJson,
    /(^|[;&|]\s*)(?:pnpm exec |npx |node_modules\/\.bin\/)?(?:electron|electron-builder|electron-forge)(?:\.cmd)?(?:\s|$)/i
  );
}

function commandAvailable(commandRunner, command, args) {
  try {
    const result = commandRunner(command, args);
    return result.status === 0;
  } catch {
    return false;
  }
}

function defaultCommandRunner(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function collectHostCapabilities(options) {
  const commandRunner = options.commandRunner ?? defaultCommandRunner;
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;

  return {
    platform,
    android_sdk_configured: Boolean(env.ANDROID_HOME || env.ANDROID_SDK_ROOT),
    commands: {
      adb: commandAvailable(commandRunner, "adb", ["version"]),
      gradle: commandAvailable(commandRunner, "gradle", ["--version"]),
      java: commandAvailable(commandRunner, "java", ["-version"]),
      xcodebuild: commandAvailable(commandRunner, "xcodebuild", ["-version"]),
    },
  };
}

function collectRepoState(cwd) {
  const packageJson = readPackageJson(cwd);
  const playwrightConfigText = readRepoTextFile(cwd, "playwright.config.ts");

  const capacitorConfigFiles = existingFiles(cwd, [
    "capacitor.config.ts",
    "capacitor.config.js",
    "capacitor.config.mjs",
    "capacitor.config.cjs",
    "capacitor.config.json",
  ]);
  const androidProjectFiles = existingFiles(cwd, [
    "android/app/build.gradle",
    "android/app/build.gradle.kts",
    "android/settings.gradle",
    "android/settings.gradle.kts",
  ]);
  const androidGradleWrapperFiles = existingFiles(cwd, [
    "android/gradlew",
    "gradlew",
  ]);
  const iosProjectFiles = existingFiles(cwd, [
    "ios/App/App.xcodeproj/project.pbxproj",
    "ios/App/App.xcworkspace/contents.xcworkspacedata",
    "ios/App/Podfile",
    "ios/Podfile",
  ]);
  const electronMainFiles = existingFiles(cwd, [
    "electron/main.ts",
    "electron/main.js",
    "electron/main.mjs",
    "electron/main.cjs",
    "desktop/main.ts",
    "desktop/main.js",
  ]);
  const electronConfigFiles = existingFiles(cwd, [
    "electron-builder.yml",
    "electron-builder.yaml",
    "electron-builder.json",
    "forge.config.ts",
    "forge.config.js",
  ]);

  return {
    package: {
      has_capacitor_core: hasDependency(packageJson, "@capacitor/core"),
      has_capacitor_cli: hasDependency(packageJson, "@capacitor/cli"),
      has_electron_dependency: hasDependency(packageJson, "electron"),
      has_electron_builder_dependency:
        hasDependency(packageJson, "electron-builder") ||
        hasDependency(packageJson, "@electron-forge/cli"),
      has_capacitor_script: hasCapacitorPackageScript(packageJson),
      has_electron_script: hasElectronPackageScript(packageJson),
    },
    files: {
      capacitor_config: capacitorConfigFiles,
      android_project: androidProjectFiles,
      android_gradle_wrapper: androidGradleWrapperFiles,
      ios_project: iosProjectFiles,
      electron_config: electronConfigFiles,
      electron_main: electronMainFiles,
    },
    playwright: {
      projects: [
        ...Object.values(CAPACITOR_SIM_PROJECTS),
        ELECTRON_SIM_PROJECT,
      ].filter((projectName) =>
        playwrightConfigDefinesProject(playwrightConfigText, projectName)
      ),
    },
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function playwrightConfigDefinesProject(playwrightConfigText, projectName) {
  const configWithoutComments =
    stripPlaywrightConfigComments(playwrightConfigText);
  const quotedProjectName = escapeRegex(projectName);
  return new RegExp(
    String.raw`\bname\s*:\s*["'\`]${quotedProjectName}["'\`]`
  ).test(configWithoutComments);
}

function stripPlaywrightConfigComments(playwrightConfigText) {
  return playwrightConfigText
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function simulationStatus(repoState, simulationProject) {
  if (repoState.playwright.projects.includes(simulationProject)) {
    return {
      available: true,
      tier: "browser-simulation",
      project: simulationProject,
    };
  }

  return {
    available: false,
    tier: "missing",
    project: simulationProject,
  };
}

function blocked(reason) {
  return { ready: false, reason };
}

function ready(reason) {
  return { ready: true, reason };
}

function capacitorAndroidReadiness(repoState, host) {
  if (!repoState.package.has_capacitor_core) {
    return blocked("missing @capacitor/core dependency");
  }
  if (repoState.files.capacitor_config.length === 0) {
    return blocked("missing capacitor.config.*");
  }
  if (repoState.files.android_project.length === 0) {
    return blocked("missing committed android/ native project");
  }
  if (
    !repoState.package.has_capacitor_cli &&
    !repoState.package.has_capacitor_script
  ) {
    return blocked("missing Capacitor CLI dependency or package script");
  }
  if (!host.commands.java) {
    return blocked("missing Java runtime");
  }
  if (!host.commands.adb && !host.android_sdk_configured) {
    return blocked(
      "missing Android SDK signal (adb, ANDROID_HOME, or ANDROID_SDK_ROOT)"
    );
  }
  if (
    !host.commands.gradle &&
    repoState.files.android_gradle_wrapper.length === 0
  ) {
    return blocked("missing Gradle or committed Gradle wrapper");
  }

  return ready("Capacitor Android project and build prerequisites detected");
}

function capacitorIosReadiness(repoState, host) {
  if (!repoState.package.has_capacitor_core) {
    return blocked("missing @capacitor/core dependency");
  }
  if (repoState.files.capacitor_config.length === 0) {
    return blocked("missing capacitor.config.*");
  }
  if (repoState.files.ios_project.length === 0) {
    return blocked("missing committed ios/ native project");
  }
  if (host.platform !== "darwin") {
    return blocked("iOS package prerequisites require a macOS host");
  }
  if (!host.commands.xcodebuild) {
    return blocked("missing xcodebuild");
  }

  return ready("Capacitor iOS project and Xcode prerequisites detected");
}

function electronReadiness(repoState) {
  if (!repoState.package.has_electron_dependency) {
    return blocked("missing electron dependency");
  }
  if (repoState.files.electron_main.length === 0) {
    return blocked("missing Electron main-process entrypoint");
  }
  if (
    !repoState.package.has_electron_script &&
    !repoState.package.has_electron_builder_dependency &&
    repoState.files.electron_config.length === 0
  ) {
    return blocked("missing Electron run/package script or builder config");
  }

  return ready("Electron main process and package prerequisites detected");
}

function createSurfaceEvidence(name, simulation, readiness) {
  const evidenceTier = readiness.ready
    ? "package-prerequisites"
    : simulation.available
      ? simulation.tier
      : "none";

  return {
    name,
    evidence_tier: evidenceTier,
    package_prerequisites_ready: readiness.ready,
    simulation_project: simulation.available ? simulation.project : null,
    status: readiness.ready ? "ready" : "blocked",
    blocker: readiness.ready ? null : readiness.reason,
  };
}

function createNativeEvidence(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const repoState = collectRepoState(cwd);
  const host = collectHostCapabilities(options);
  const surfaces = [
    createSurfaceEvidence(
      "capacitor-ios",
      simulationStatus(repoState, CAPACITOR_SIM_PROJECTS["capacitor-ios"]),
      capacitorIosReadiness(repoState, host)
    ),
    createSurfaceEvidence(
      "capacitor-android",
      simulationStatus(repoState, CAPACITOR_SIM_PROJECTS["capacitor-android"]),
      capacitorAndroidReadiness(repoState, host)
    ),
    createSurfaceEvidence(
      "electron-shell",
      simulationStatus(repoState, ELECTRON_SIM_PROJECT),
      electronReadiness(repoState)
    ),
  ];
  const packagePrerequisitesReady = surfaces.some(
    (surface) => surface.package_prerequisites_ready
  );
  const simulationAvailable = surfaces.some(
    (surface) => surface.evidence_tier === "browser-simulation"
  );

  const evidence = {
    schema_version: NATIVE_EVIDENCE_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    host,
    repo: repoState,
    surfaces,
    summary: {
      highest_available_tier: packagePrerequisitesReady
        ? "package-prerequisites"
        : simulationAvailable
          ? "browser-simulation"
          : "none",
      package_prerequisites_ready: packagePrerequisitesReady,
      simulation_available: simulationAvailable,
      actual_package_runtime_evidence: false,
    },
  };
  assertNoLocalPathLeak(evidence, cwd);
  return evidence;
}

function assertNoLocalPathLeak(evidence, cwd) {
  const serialized = JSON.stringify(evidence);
  const localPathMarkers = [
    cwd,
    cwd.replaceAll("\\", "/"),
    cwd.replaceAll("/", "\\"),
  ].filter(Boolean);
  if (localPathMarkers.some((marker) => serialized.includes(marker))) {
    throw new Error("native evidence output contains a local absolute path");
  }
}

function formatText(evidence) {
  const lines = [
    `Native surface evidence: ${evidence.summary.highest_available_tier}`,
    `Host: ${evidence.host.platform}`,
    "",
  ];

  for (const surface of evidence.surfaces) {
    const status =
      surface.status === "ready"
        ? "package prerequisites detected"
        : `blocked: ${surface.blocker}`;
    const simulation = surface.simulation_project
      ? `; simulation project: ${surface.simulation_project}`
      : "; no simulation project detected";
    lines.push(
      `- ${surface.name}: ${surface.evidence_tier} (${status}${simulation})`
    );
  }

  lines.push(
    "",
    "This classifier does not run native/Electron package builds or runtime smoke tests.",
    "Use --require-package-prereqs as a prerequisites gate; real shell claims still need separate package/runtime evidence."
  );

  return lines.join("\n");
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function writeOutputFile(file, value) {
  const target = path.resolve(file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence artifacts to supplied output paths.
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence artifacts to supplied output paths.
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(value) {
  process.stdout.write(`${value}\n`);
}

function usage() {
  return `Usage:
  node ops/scripts/native-surface-evidence.cjs [--json]
  node ops/scripts/native-surface-evidence.cjs --require-simulation
  node ops/scripts/native-surface-evidence.cjs --require-package-prereqs
  node ops/scripts/native-surface-evidence.cjs --json --output test-results/native-surface-evidence.json
`;
}

function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);

    if (args.help) {
      writeText(usage());
      return;
    }

    const evidence = createNativeEvidence({
      cwd: args.cwd ? String(args.cwd) : process.cwd(),
    });

    if (args.output) {
      writeOutputFile(String(args.output), evidence);
    }

    if (args.json || args.format === "json") {
      writeJson(evidence);
    } else {
      writeText(formatText(evidence));
    }

    if (args["require-simulation"] && !evidence.summary.simulation_available) {
      console.error(
        "error: native surface simulation projects are not configured"
      );
      process.exitCode = 1;
    }

    if (
      args["require-package-prereqs"] &&
      !evidence.summary.package_prerequisites_ready
    ) {
      console.error(
        "error: native/Electron package prerequisites are not available"
      );
      process.exitCode = 1;
    }

    if (args["require-real"]) {
      console.error(
        "error: --require-real is intentionally unsupported; this classifier only verifies package prerequisites, not real package/runtime execution"
      );
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      `error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  NATIVE_EVIDENCE_SCHEMA_VERSION,
  createNativeEvidence,
  formatText,
  parseArgs,
  playwrightConfigDefinesProject,
};
