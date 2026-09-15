import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArtworkDocumentationRecordView } from "@/components/artwork-documentation/ArtworkDocumentationWorkspace";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import museumProfile from "@/__tests__/fixtures/artwork-documentation-profile-v3.json";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type * as documentationApi from "@/services/api/artwork-documentation-api";
import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: jest.fn() }),
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  __esModule: true,
  default: () => null,
  useDocumentationActor: () => ({
    actorKey: "artist-a",
    connectedProfile: { id: "artist-a" },
  }),
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual<typeof documentationApi>(
    "@/services/api/artwork-documentation-api"
  ),
  getDocumentationRevisions: jest.fn().mockResolvedValue({ data: [] }),
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationRecordHeader",
  () => ({
    __esModule: true,
    default: () => <h1>Assigned work</h1>,
  })
);
jest.mock(
  "@/components/artwork-documentation/DocumentationArtworkPreview",
  () => ({
    __esModule: true,
    default: () => null,
  })
);
jest.mock("@/components/artwork-documentation/DocumentationDossier", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationMuseumJournal",
  () => ({
    __esModule: true,
    default: () => null,
  })
);
jest.mock("@/components/artwork-documentation/DocumentationSummary", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/artwork-documentation/DocumentationUpload", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/artwork-documentation/DocumentationFeedback", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/artwork-documentation/DocumentationAccess", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/artwork-documentation/DocumentationSources", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/artwork-documentation/DocumentationArtistPin", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/artwork-documentation/DocumentationNewContext", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationWorkedExample",
  () => ({
    __esModule: true,
    default: () => null,
  })
);
jest.mock(
  "@/components/artwork-documentation/DocumentationProfileUpgrade",
  () => ({
    __esModule: true,
    default: () => null,
  })
);

function Editor({
  context,
}: {
  readonly context: ApiArtworkDocumentationContext;
}) {
  return (
    <ArtworkDocumentationRecordView
      draft={useDocumentationDraft(context)}
      initialSection="review"
    />
  );
}

function navigationContext(museum: boolean, moduleId: string, fieldId: string) {
  const context = documentationFixture();
  const profile = { ...museumProfile } as unknown as typeof context.profile;
  // Keep the real server field schemas and chapters while limiting unrelated UI.
  const targetFields = new Set([
    "canonical_asset_id",
    "declared_dimensions",
    "rights_basis",
  ]);
  profile.modules = profile.modules.map((fieldModule) => ({
    ...fieldModule,
    fields: fieldModule.fields.filter((field) => targetFields.has(field.id)),
  }));
  if (!museum) {
    delete profile.media_profiles;
    profile.version = context.profile.version;
    profile.profile_id = context.profile.profile_id;
    profile.confirmation_copy_version =
      context.profile.confirmation_copy_version;
    profile.confirmation_copy = context.profile.confirmation_copy;
  }
  context.profile = profile;
  context.modules["artwork"]!.answers["media_profiles"] = {
    status: "provided",
    intended_visibility: "public_record",
    value: ["photography"],
  } as never;
  context.modules[moduleId]!.completeness.missing = [`${moduleId}.${fieldId}`];
  return context;
}

it.each([
  [true, "artwork", "canonical_asset_id", "materials"],
  [true, "artwork", "declared_dimensions", "materials"],
  [false, "artwork", "canonical_asset_id", "artwork"],
  [false, "artwork", "declared_dimensions", "artwork"],
  [true, "rights", "rights_basis", "rights"],
  [false, "rights", "rights_basis", "rights"],
] as const)(
  "recovers museum=%s %s.%s in its rendered %s chapter",
  async (museum, moduleId, fieldId, section) => {
    const context = navigationContext(museum, moduleId, fieldId);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={client}>
        <Editor context={context} />
      </QueryClientProvider>
    );
    try {
      fireEvent.click(
        screen.getByRole("button", { name: documentationFieldLabel(fieldId) })
      );
      await waitFor(() => {
        const heading = document.getElementById(
          `documentation-field-heading-${moduleId}-${fieldId}`
        );
        expect(heading).toHaveFocus();
        expect(heading).toBeVisible();
      });
      const chapter = document.getElementById(
        `documentation-answers-${context.id}-${section}`
      );
      const heading = document.getElementById(
        `documentation-field-heading-${moduleId}-${fieldId}`
      );
      expect(chapter).toContainElement(heading);
      expect(
        heading?.closest("section")?.querySelector("input, select, textarea")
      ).toBeVisible();
      expect(
        new URL(globalThis.location.href).searchParams.get("section")
      ).toBe(section);
    } finally {
      view.unmount();
      client.clear();
    }
  }
);
