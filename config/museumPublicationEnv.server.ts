export interface MuseumPublicationEnvironment {
  readonly MUSEUM_PUBLICATION_TEST_COMMIT?: string;
  readonly PLAYWRIGHT_READONLY?: string;
  readonly MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT?: string;
  readonly MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT?: string;
}

const MUSEUM_PUBLICATION_NODE_ENVIRONMENTS = new Set([
  "development",
  "production",
  "test",
  "local",
]);

export function isMuseumLocalFixtureEnvironment(
  environment: MuseumPublicationEnvironment,
  nodeEnvironment: string | undefined
): boolean {
  return (
    nodeEnvironment !== "production" &&
    environment.MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT !== undefined &&
    environment.PLAYWRIGHT_READONLY === "1"
  );
}

export function getMuseumPublicationEnvironment(): MuseumPublicationEnvironment {
  if (typeof process === "undefined" || !process.env) {
    return {};
  }
  const testCommit = process.env["MUSEUM_PUBLICATION_TEST_COMMIT"];
  const playwrightReadonly = process.env["PLAYWRIGHT_READONLY"];
  const localFixtureRoot = process.env["MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT"];
  const localFixtureCommit =
    process.env["MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT"];
  return {
    ...(testCommit === undefined
      ? {}
      : { MUSEUM_PUBLICATION_TEST_COMMIT: testCommit }),
    ...(playwrightReadonly === undefined
      ? {}
      : { PLAYWRIGHT_READONLY: playwrightReadonly }),
    ...(localFixtureRoot === undefined
      ? {}
      : { MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT: localFixtureRoot }),
    ...(localFixtureCommit === undefined
      ? {}
      : { MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT: localFixtureCommit }),
  };
}

export function getMuseumPublicationNodeEnvironment(): string | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }
  const publicRuntime = process.env["PUBLIC_RUNTIME"];
  if (publicRuntime !== undefined) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(publicRuntime) as unknown;
    } catch {
      throw new Error("museum_publication_runtime_environment_invalid");
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("museum_publication_runtime_environment_invalid");
    }
    const runtimeNodeEnvironment = (parsed as Record<string, unknown>)[
      "NODE_ENV"
    ];
    if (runtimeNodeEnvironment !== undefined) {
      if (
        typeof runtimeNodeEnvironment !== "string" ||
        !MUSEUM_PUBLICATION_NODE_ENVIRONMENTS.has(runtimeNodeEnvironment)
      ) {
        throw new Error("museum_publication_runtime_environment_invalid");
      }
      return runtimeNodeEnvironment;
    }
  }
  return process.env["NODE_ENV"];
}
