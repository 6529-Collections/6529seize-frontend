import CreateDropPoll, {
  createDefaultDropPollDraft,
  validateCreateDropPollDraft,
} from "@/components/waves/CreateDropPoll";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

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
    expect(result.request?.anonymous).toBe(false);
  });

  it("includes the anonymous setting in the request", () => {
    const draft = {
      ...createDefaultDropPollDraft(),
      anonymous: true,
      options: ["First", "Second"],
      closingTime: new Date(Date.now() + 60_000).toISOString(),
    };

    const result = validateCreateDropPollDraft(draft);

    expect(result.error).toBeNull();
    expect(result.request?.anonymous).toBe(true);
  });

  it("lets the creator toggle anonymous polls", async () => {
    const draft = {
      ...createDefaultDropPollDraft(),
      options: ["First", "Second"],
    };
    const onChange = jest.fn();

    render(
      React.createElement(CreateDropPoll, {
        draft,
        disabled: false,
        validationError: null,
        onChange,
        onRemove: jest.fn(),
      })
    );

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Anonymous poll" })
    );

    expect(onChange).toHaveBeenCalledWith({
      ...draft,
      anonymous: true,
    });
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
