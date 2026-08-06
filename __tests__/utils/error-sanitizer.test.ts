import { isIndexedDBError } from "@/utils/error-sanitizer";

describe("isIndexedDBError", () => {
  it.each([
    "Unable to open database file on disk",
    "UnknownError: Unable to open database file on disk",
  ])("recognizes the WebKit IndexedDB open failure: %s", (message) => {
    expect(isIndexedDBError(message)).toBe(true);
  });

  it.each([
    "Attempt to get a record from database without an in-progress transaction",
    "UnknownError: Attempt to get a record from database without an in-progress transaction",
  ])("recognizes the WebKit IndexedDB record failure: %s", (message) => {
    expect(isIndexedDBError(message)).toBe(true);
  });

  it.each([
    "Unable to open database file",
    "Unable to open database file on disk because it is locked",
    "UnknownError:Unable to open database file on disk",
    "UnknownError: Unable to open database file in memory",
    "Attempt to get a record from database without an in-progress transaction while reopening",
    "UnknownError:Attempt to get a record from database without an in-progress transaction",
    "Attempt to get records from database without an in-progress transaction",
    "Attempt to store a record in an object store without an in-progress transaction",
  ])("does not classify a near-miss database error: %s", (message) => {
    expect(isIndexedDBError(message)).toBe(false);
  });
});
