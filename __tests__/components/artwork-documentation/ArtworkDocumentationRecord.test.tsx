import { createRef, type ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import ArtworkDocumentationRecord, {
  type ArtworkDocumentationRecordHandle,
} from "@/components/artwork-documentation/ArtworkDocumentationRecord";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import profile from "@/__tests__/fixtures/artwork-documentation-profile-v3.json";
import type { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { documentationDraftRecord } from "@/lib/artwork-documentation/record";
import {
  associateDocumentationSource,
  patchDocumentationModule,
} from "@/services/api/artwork-documentation-api";
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock(
  "@/components/artwork-documentation/ArtworkDocumentationWorkspace",
  () => ({
    ArtworkDocumentationRecordView: ({
      draft,
    }: {
      draft: ReturnType<typeof useDocumentationDraft>;
    }) => (
      <output data-testid="record">
        {JSON.stringify(
          documentationDraftRecord(draft.context, draft.edits).modules
        )}
      </output>
    ),
  })
);
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  patchDocumentationModule: jest.fn(),
  associateDocumentationSource: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());
function fixture() {
  const context = documentationFixture();
  context.profile = profile as never;
  return context;
}
it("keeps saved answers while combining valid caller suggestions in the shared draft without confirmation", () => {
  const context = fixture();
  const title = context.modules["artwork"]!.answers["title"]!.value;
  render(
    <ArtworkDocumentationRecord
      context={context}
      artworkInfo={{
        title: "Do not overwrite",
        caption: "Supplied caption for review.",
      }}
      initialMediaProfiles={["photography", "audio", "audio", "invented"]}
    />
  );
  const modules = JSON.parse(
    screen.getByTestId("record").textContent!
  ) as Record<string, { answers: Record<string, { value: unknown }> }>;
  expect(modules["artwork"]!.answers["title"]!.value).toEqual(title);
  expect(modules["artwork"]!.answers["media_profiles"]!.value).toEqual([
    "photography",
    "audio",
  ]);
  expect(modules["context"]!.answers["caption"]!.value).toMatchObject({
    versions: [
      { text: "Supplied caption for review.", approved_by_artist: false },
    ],
  });
  expect(context.latest_revision_id).toBeNull();
});
it("does not turn viewer reads into seeded writes", () => {
  const context = fixture();
  context.mutation_capabilities.edit_modules = [];
  context.mutation_capabilities.confirm_as_artist = false;
  render(
    <ArtworkDocumentationRecord
      context={context}
      artworkInfo={{
        caption: "Must not write",
        externalIdentifiers: [
          { namespace: "Caller", identifier: "Must not write" },
        ],
      }}
      initialMediaProfiles={["audio"]}
    />
  );
  expect(screen.getByTestId("record")).not.toHaveTextContent("Must not write");
  expect(patchDocumentationModule).not.toHaveBeenCalled();
});
it("accepts typed token and catalogue references as draft facts, preserves saved identifiers and never confirms them", () => {
  const context = fixture();
  context.modules["artwork"]!.answers["external_identifiers"] = {
    status: "provided",
    intended_visibility: "public_record",
    value: [
      { id: "kept-id", namespace: "Artist inventory", identifier: "A-17" },
    ],
  } as never;
  render(
    <ArtworkDocumentationRecord
      context={context}
      artworkInfo={{
        tokenReferences: [
          {
            chain_namespace: "eip155",
            chain_id: "1",
            contract_address: "0x1111111111111111111111111111111111111111",
            token_id: "42",
            token_standard: "erc721",
            relationship: "represents_work",
            note: "Caller-supplied reference for artist review.",
          },
        ],
        externalIdentifiers: [
          { namespace: "Caller catalogue", identifier: "do-not-overwrite" },
        ],
      }}
    />
  );
  const modules = JSON.parse(
    screen.getByTestId("record").textContent!
  ) as Record<string, { answers: Record<string, { value: unknown }> }>;
  expect(modules["artwork"]!.answers["token_references"]!.value).toEqual([
    expect.objectContaining({
      id: expect.stringMatching(/^[\da-f-]{36}$/i),
      token_id: "42",
      note: "Caller-supplied reference for artist review.",
    }),
  ]);
  expect(modules["artwork"]!.answers["external_identifiers"]!.value).toEqual([
    { id: "kept-id", namespace: "Artist inventory", identifier: "A-17" },
  ]);
  expect(context.latest_revision_id).toBeNull();
  expect(context.assets).toEqual([]);
});
it("exposes source-link recovery through the shared component without creating another work", async () => {
  const context = fixture();
  const ref = createRef<ArtworkDocumentationRecordHandle>();
  jest
    .mocked(associateDocumentationSource)
    .mockResolvedValue({ ...context, draft_version: 2 });
  render(<ArtworkDocumentationRecord ref={ref} context={context} />);
  let linked: unknown;
  await act(async () => {
    linked = await ref.current!.onDropSubmitted("published-drop");
  });
  expect(linked).toEqual({
    linked: true,
    contextId: context.id,
    workId: context.work_id,
  });
  expect(associateDocumentationSource).toHaveBeenCalledWith(
    context.id,
    "published-drop",
    1,
    expect.any(AbortSignal)
  );
});
