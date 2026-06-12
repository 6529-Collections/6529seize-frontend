import {
  getFriendlyToastContent,
  getToastAutoClose,
  getToastErrorDetails,
  normalizeToastText,
} from "@/helpers/toast.helpers";

describe("toast.helpers", () => {
  it("normalizes sentence casing and punctuation", () => {
    expect(normalizeToastText("Saved")).toBe("Saved.");
    expect(normalizeToastText("Saved!")).toBe("Saved.");
    expect(normalizeToastText("  Saved   now  ")).toBe("Saved now.");
  });

  it("uses longer auto-close timing for errors", () => {
    expect(getToastAutoClose("success")).toBe(3000);
    expect(getToastAutoClose("error")).toBe(8000);
  });

  it("maps vague errors to clear user-facing copy", () => {
    expect(
      getFriendlyToastContent({
        type: "error",
        message: "Something went wrong",
      })
    ).toEqual({
      title: "Couldn't complete this action.",
      description: "Please try again.",
    });
  });

  it("keeps actionable provider details out of the headline", () => {
    expect(
      getFriendlyToastContent({
        type: "error",
        message: "Failed to save profile: backend unavailable",
      })
    ).toEqual({
      title: "Couldn't save profile.",
      description: "Please try again.",
      details: "backend unavailable.",
    });
  });

  it("treats wallet rejections as canceled actions", () => {
    expect(
      getFriendlyToastContent({
        type: "error",
        message: "User rejected the request",
      })
    ).toEqual({
      title: "Request canceled in your wallet.",
      description: "No changes were made.",
    });
  });

  it("only maps clear insufficient balance errors to balance copy", () => {
    expect(
      getFriendlyToastContent({
        type: "error",
        message: "Insufficient funds for gas",
      })
    ).toEqual({
      title: "Insufficient balance.",
      description: "Check your wallet balance and try again.",
      details: "Insufficient funds for gas.",
    });

    expect(
      getFriendlyToastContent({
        type: "error",
        message: "Unable to read wallet balance",
      })
    ).toEqual({
      title: "Couldn't complete this action.",
      description: "Please try again.",
      details: "Unable to read wallet balance.",
    });
  });

  it("sanitizes error details", () => {
    expect(getToastErrorDetails(new Error("Unauthorized"))).toBe(
      "Authorization failed. Please reconnect your wallet."
    );
  });

  it("does not show generic sanitizer output as details", () => {
    expect(getToastErrorDetails(null)).toBeUndefined();
    expect(getToastErrorDetails(null, "Use another wallet")).toBe(
      "Use another wallet."
    );
  });
});
