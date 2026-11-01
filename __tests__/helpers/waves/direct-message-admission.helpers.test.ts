import { getDirectMessageAdmissionErrorMessage } from "@/helpers/waves/direct-message-admission.helpers";

function apiError(body: unknown) {
  const error = new Error("server copy") as Error & {
    status: number;
    response: { status: number; body: unknown };
  };
  error.status = 403;
  error.response = {
    status: 403,
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
  return error;
}

describe("getDirectMessageAdmissionErrorMessage", () => {
  it.each([
    [
      "DM_RECIPIENT_NOT_ACCEPTING",
      "@alice doesn’t accept new direct messages.",
    ],
    [
      "DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY",
      "@alice only accepts new direct messages from people they follow.",
    ],
    [
      "DM_RECIPIENT_GROUP_MEMBERS_ONLY",
      "@alice only accepts new direct messages from members of a group they chose.",
    ],
    [
      "DM_SENDER_BLOCKED_RECIPIENT",
      "You blocked @alice. Unblock them to start a new direct message.",
    ],
  ])("localizes %s", (code, expected) => {
    expect(
      getDirectMessageAdmissionErrorMessage(
        "en-US",
        apiError({ error: "server copy", code, handle: "alice" })
      )
    ).toBe(expected);
  });

  it("names a public group only when the API includes it", () => {
    expect(
      getDirectMessageAdmissionErrorMessage(
        "en-US",
        apiError({
          error: "server copy",
          code: "DM_RECIPIENT_GROUP_MEMBERS_ONLY",
          handle: "alice",
          group_id: "group-1",
          group_name: "Meme holders",
        })
      )
    ).toBe(
      "@alice only accepts new direct messages from members of the group “Meme holders”."
    );
  });

  it("ignores a group name on other codes", () => {
    expect(
      getDirectMessageAdmissionErrorMessage(
        "en-US",
        apiError({
          code: "DM_RECIPIENT_NOT_ACCEPTING",
          handle: "alice",
          group_name: "Meme holders",
        })
      )
    ).toBe("@alice doesn’t accept new direct messages.");
  });

  it.each([
    ["an unrelated code", apiError({ code: "SOMETHING_ELSE", handle: "a" })],
    ["a missing handle", apiError({ code: "DM_RECIPIENT_NOT_ACCEPTING" })],
    ["a non-JSON body", apiError("Bad gateway")],
    ["a legacy string error", "You can't start a new direct message"],
    ["no error", undefined],
  ])("falls back for %s", (_name, error) => {
    expect(
      getDirectMessageAdmissionErrorMessage("en-US", error)
    ).toBeUndefined();
  });

  it("does not inherit codes from the object prototype", () => {
    expect(
      getDirectMessageAdmissionErrorMessage(
        "en-US",
        apiError({ code: "toString", handle: "alice" })
      )
    ).toBeUndefined();
  });
});
