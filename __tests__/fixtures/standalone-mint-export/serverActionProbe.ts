"use server";

// Negative-control fixture for __tests__/contracts/standalone-mint-export.test.ts.
// Nothing in the app imports it; the test only parses it.
export async function probeServerAction(): Promise<void> {}
