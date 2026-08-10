export interface MuseumPublicationEnvironment {
  readonly MUSEUM_PUBLICATION_TEST_COMMIT?: string;
  readonly PLAYWRIGHT_READONLY?: string;
  readonly MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT?: string;
  readonly MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT?: string;
}

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
