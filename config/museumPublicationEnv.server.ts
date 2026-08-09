export interface MuseumPublicationEnvironment {
  readonly MUSEUM_PUBLICATION_TEST_COMMIT?: string;
  /** Explicit CI-only compatibility mode for a source before catalog activation. */
  readonly MUSEUM_PUBLICATION_UNCATALOGUED_TEST_MODE?: string;
  readonly PLAYWRIGHT_READONLY?: string;
  readonly MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT?: string;
  readonly MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT?: string;
  readonly MUSEUM_PUBLICATION_LOCAL_FIXTURE_QUALIFY?: string;
}

export function isMuseumProductionBuildPhase(): boolean {
  return process.env["NEXT_PHASE"] === "phase-production-build";
}

export function getMuseumPublicationEnvironment(): MuseumPublicationEnvironment {
  if (typeof process === "undefined" || !process.env) {
    return {};
  }
  const testCommit = process.env["MUSEUM_PUBLICATION_TEST_COMMIT"];
  const uncataloguedTestMode =
    process.env["MUSEUM_PUBLICATION_UNCATALOGUED_TEST_MODE"];
  const playwrightReadonly = process.env["PLAYWRIGHT_READONLY"];
  const localFixtureRoot = process.env["MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT"];
  const localFixtureCommit =
    process.env["MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT"];
  const localFixtureQualify =
    process.env["MUSEUM_PUBLICATION_LOCAL_FIXTURE_QUALIFY"];
  return {
    ...(testCommit === undefined
      ? {}
      : { MUSEUM_PUBLICATION_TEST_COMMIT: testCommit }),
    ...(uncataloguedTestMode === undefined
      ? {}
      : { MUSEUM_PUBLICATION_UNCATALOGUED_TEST_MODE: uncataloguedTestMode }),
    ...(playwrightReadonly === undefined
      ? {}
      : { PLAYWRIGHT_READONLY: playwrightReadonly }),
    ...(localFixtureRoot === undefined
      ? {}
      : { MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT: localFixtureRoot }),
    ...(localFixtureCommit === undefined
      ? {}
      : { MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT: localFixtureCommit }),
    ...(localFixtureQualify === undefined
      ? {}
      : { MUSEUM_PUBLICATION_LOCAL_FIXTURE_QUALIFY: localFixtureQualify }),
  };
}
