export interface MuseumPublicationEnvironment {
  readonly MUSEUM_PUBLICATION_TEST_COMMIT?: string;
  readonly PLAYWRIGHT_READONLY?: string;
}

export function getMuseumPublicationEnvironment(): MuseumPublicationEnvironment {
  if (typeof process === "undefined" || !process.env) {
    return {};
  }
  const testCommit = process.env["MUSEUM_PUBLICATION_TEST_COMMIT"];
  const playwrightReadonly = process.env["PLAYWRIGHT_READONLY"];
  return {
    ...(testCommit === undefined
      ? {}
      : { MUSEUM_PUBLICATION_TEST_COMMIT: testCommit }),
    ...(playwrightReadonly === undefined
      ? {}
      : { PLAYWRIGHT_READONLY: playwrightReadonly }),
  };
}
