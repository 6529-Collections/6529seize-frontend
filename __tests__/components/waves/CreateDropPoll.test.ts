import {
  createDefaultDropPollDraft,
  validateCreateDropPollDraft,
} from "@/components/waves/CreateDropPoll";

describe("CreateDropPoll helpers", () => {
  it("creates a runtime JSON array for poll options", () => {
    const draft = {
      ...createDefaultDropPollDraft(),
      options: ["First", "Second"],
      closingTime: new Date(Date.now() + 60_000).toISOString(),
    };

    const result = validateCreateDropPollDraft(draft);

    expect(result.error).toBeNull();
    expect(Array.isArray(result.request?.options)).toBe(true);
    expect(result.request?.options).toEqual(["First", "Second"]);
  });

  it("rejects duplicate options", () => {
    const draft = {
      ...createDefaultDropPollDraft(),
      options: ["First", " first "],
      closingTime: new Date(Date.now() + 60_000).toISOString(),
    };

    const result = validateCreateDropPollDraft(draft);

    expect(result.request).toBeNull();
    expect(result.error).toBe("Poll options must be unique.");
  });
});
