import { isIndexedDBError } from "@/utils/error-sanitizer";

describe("isIndexedDBError", () => {
  it.each([
    "Unable to open database file on disk",
    "UnknownError: Unable to open database file on disk",
  ])("recognizes the WebKit IndexedDB open failure: %s", (message) => {
    expect(isIndexedDBError(message)).toBe(true);
  });

  it.each([
    "Unable to open database file",
    "Unable to open database file on disk because it is locked",
    "UnknownError:Unable to open database file on disk",
    "UnknownError: Unable to open database file in memory",
  ])("does not classify a near-miss database error: %s", (message) => {
    expect(isIndexedDBError(message)).toBe(false);
  });
});
