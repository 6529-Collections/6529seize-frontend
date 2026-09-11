import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DocumentationArtistPin from "@/components/artwork-documentation/DocumentationArtistPin";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { pinDocumentationArtistRecord } from "@/services/api/artwork-documentation-api";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  pinDocumentationArtistRecord: jest.fn(),
}));

it.each([false, true])(
  "does not offer artist information import to a non-artist with identity editing=%s",
  (canEditIdentity) => {
    const context = documentationFixture();
    context.mutation_capabilities.confirm_as_artist = false;
    if (!canEditIdentity) context.mutation_capabilities.edit_modules = [];
    context.available_artist_record = {
      id: "new-artist-record",
      record_version: 2,
      answers: {},
    };
    const controller = new DocumentationDraftController(
      context,
      { read: jest.fn(), save: jest.fn() },
      jest.fn()
    );
    const { container } = render(
      <DocumentationArtistPin context={context} controller={controller} />
    );
    expect(container).toBeEmptyDOMElement();
    controller.dispose();
  }
);

it("lets the artist explicitly adopt the available identity record", async () => {
  const context = documentationFixture();
  context.available_artist_record = {
    id: "new-artist-record",
    record_version: 2,
    answers: {},
  };
  jest.mocked(pinDocumentationArtistRecord).mockResolvedValue({
    ...context,
    artist_record_revision_id: "new-artist-record",
    draft_version: 2,
  });
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  render(<DocumentationArtistPin context={context} controller={controller} />);
  fireEvent.click(
    screen.getByText("Use updated artist information", { selector: "summary" })
  );
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() =>
    expect(pinDocumentationArtistRecord).toHaveBeenCalledWith(
      context,
      "new-artist-record",
      expect.any(AbortSignal)
    )
  );
  controller.dispose();
});
