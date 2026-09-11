import { isReplyTargetUnavailableError } from "@/components/waves/create-drop-content/reply-target-unavailable";

describe("isReplyTargetUnavailableError", () => {
  it("matches the current backend invalid reply message", () => {
    expect(
      isReplyTargetUnavailableError(
        "Invalid reply. Drop $drop-1/1 doesn't exist"
      )
    ).toBe(true);
  });

  it("matches structured responses with a future stable code", () => {
    expect(
      isReplyTargetUnavailableError({
        response: {
          body: JSON.stringify({
            error_code: "REPLY_TARGET_DELETED",
            message: "Reply target was deleted",
          }),
        },
      })
    ).toBe(true);
  });

  it("does not match generic permission failures", () => {
    expect(
      isReplyTargetUnavailableError({
        status: 403,
        message: "User is not allowed to create drops",
      })
    ).toBe(false);
  });
});
