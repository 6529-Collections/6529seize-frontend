import { isProductionBuildPhase } from "@/config/nextPhase";

describe("isProductionBuildPhase", () => {
  const originalPhase = process.env["NEXT_PHASE"];

  afterEach(() => {
    if (originalPhase === undefined) {
      delete process.env["NEXT_PHASE"];
    } else {
      process.env["NEXT_PHASE"] = originalPhase;
    }
  });

  it("is true only while next build is prerendering", () => {
    process.env["NEXT_PHASE"] = "phase-production-build";

    expect(isProductionBuildPhase()).toBe(true);
  });

  it.each(["phase-production-server", "phase-development-server", undefined])(
    "is false for %s",
    (phase) => {
      if (phase === undefined) {
        delete process.env["NEXT_PHASE"];
      } else {
        process.env["NEXT_PHASE"] = phase;
      }

      expect(isProductionBuildPhase()).toBe(false);
    }
  );
});
