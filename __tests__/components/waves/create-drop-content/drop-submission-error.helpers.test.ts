import { getDropSubmissionErrorContent } from "@/components/waves/create-drop-content/drop-submission-error.helpers";

it("shows the consumed-approval explanation instead of generic retry guidance", () => {
  const error = Object.assign(new Error("approval used"), {
    response: { body: { code: "MODERATION_PERMIT_CONSUMED" } },
  });
  expect(
    getDropSubmissionErrorContent({
      error,
      locale: "en-US",
      isContentModerationRejection: false,
      isProfileSuspendedRejection: false,
    })
  ).toEqual({
    description:
      "This approval has already been used. Only a retry of the original submission can return the saved result.",
  });
});
