import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  canImportDocumentationAnswer,
  documentationChoiceEditor,
  isPublicationOnly,
  latestDocumentationProfiles,
} from "@/lib/artwork-documentation/intake";
import { confirmationCopyMatches } from "@/lib/artwork-documentation/confirmation";
import { ARTWORK_DOCUMENTATION_MESSAGES } from "@/i18n/messages/artwork-documentation";

describe("publication intake boundaries", () => {
  it("selects the newest profile without rewriting existing contexts", () => {
    const legacy = documentationFixture().profile;
    const latest = {
      ...legacy,
      version: 2,
      intake_mode: "publication_only" as never,
    };
    const another = { ...latest, program_id: "another-program" };
    expect(latestDocumentationProfiles([legacy, latest, another])).toEqual([
      latest,
      another,
    ]);
    expect(isPublicationOnly(legacy)).toBe(false);
    expect(legacy.version).toBe(1);
  });
  it("cannot copy restricted or unsupported source answers into a publication record", () => {
    const context = documentationFixture();
    context.profile.intake_mode = "publication_only" as never;
    const publicAnswer = context.modules["artwork"]!.answers["title"]!;
    expect(
      canImportDocumentationAnswer(
        context.profile,
        "artwork.title",
        publicAnswer
      )
    ).toBe(true);
    expect(
      canImportDocumentationAnswer(
        context.profile,
        "identity.private_contact",
        publicAnswer
      )
    ).toBe(false);
    expect(
      canImportDocumentationAnswer(context.profile, "artwork.title", {
        ...publicAnswer,
        intended_visibility: "restricted" as never,
      })
    ).toBe(false);
    expect(
      canImportDocumentationAnswer(context.profile, "artwork.title", {
        ...publicAnswer,
        status: "withheld" as never,
      })
    ).toBe(false);
    expect(
      canImportDocumentationAnswer(context.profile, "artwork.title", {
        ...publicAnswer,
        value: { wrong: "shape" },
      })
    ).toBe(false);
  });
  it("uses the server's permitted interview choices rather than legacy client options", () => {
    expect(
      documentationChoiceEditor(
        {
          kind: "choice",
          options: [
            "not_requested",
            "private_review",
            "intended_public_record",
          ],
        },
        { type: "string", enum: ["intended_public_record"] } as never
      )
    ).toEqual({ kind: "choice", options: ["intended_public_record"] });
  });
  it("accepts only the exact reviewed confirmation copy for either version", () => {
    const profile = documentationFixture().profile;
    expect(confirmationCopyMatches(profile)).toBe(true);
    profile.confirmation_copy_version = "artwork-documentation-confirmation-v2";
    expect(confirmationCopyMatches(profile)).toBe(false);
    profile.confirmation_copy =
      ARTWORK_DOCUMENTATION_MESSAGES[
        "artworkDocumentation.publication.confirmCopy"
      ];
    expect(confirmationCopyMatches(profile)).toBe(true);
    profile.confirmation_copy += " Changed.";
    expect(confirmationCopyMatches(profile)).toBe(false);
  });
});
