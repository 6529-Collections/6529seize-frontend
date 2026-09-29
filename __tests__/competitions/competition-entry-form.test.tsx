import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CompetitionEntryForm from "@/components/competitions/CompetitionEntryForm";
import { createCompetitionEntry } from "@/services/api/competitions-api";

let mockRequiredMetadata: Array<{ name: string; type: string }> = [];
let mockTerms: string | null = null;
const mockSnapshot = {
  title: null,
  parts: [
    {
      content: "See #[Another wave] and @admins",
      media: [],
      quoted_drop: null,
    },
  ],
  metadata: [],
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_waves: [
    { wave_id: "another-wave", wave_name_in_content: "Another wave" },
  ],
  hide_link_preview: true,
  signature: "old-signature",
  signer_address: "old-signer",
  is_safe_signature: true,
};
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ isError: false }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "author" },
    activeProfileProxy: null,
    requestAuth: async () => ({ success: true }),
  }),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    wave: {
      id: "wave",
      name: "Wave",
      picture: null,
      visibility: { scope: { group: null } },
      wave: { authenticated_user_eligible_for_admin: false },
    },
    competition: {
      id: "competition",
      config_version: 1,
      title: "Competition",
      lifecycle: "PUBLISHED",
      participation: {
        required_metadata: mockRequiredMetadata,
        required_media: [],
        signature_required: false,
        terms: mockTerms,
      },
      permissions: { submit: true },
    },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "author:self",
}));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignature: () => jest.fn(),
}));
jest.mock("@/helpers/ProfileHelpers", () => ({
  profileAndConsolidationsToProfileMin: () => ({
    id: "author",
    handle: "author",
    primary_address: "0x123",
  }),
}));
jest.mock("@/components/utils/input/identity/IdentitySearch", () => ({
  __esModule: true,
  default: () => null,
  IdentitySearchSize: { MD: "md" },
}));
jest.mock("@/components/waves/CreateDropEmojiPickerLayerContext", () => ({
  CreateDropEmojiPickerLayerProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => children,
}));
jest.mock(
  "@/components/drops/create/lexical/plugins/mentions/MentionSearchScopeContext",
  () => ({
    MentionSearchScopeProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  })
);
jest.mock("@/components/drops/create/DropEditor", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(
      (
        props: { onCanSubmitChange: (ready: boolean) => void },
        ref: React.Ref<unknown>
      ) => {
        React.useImperativeHandle(ref, () => ({
          getDropSnapshot: () => mockSnapshot,
        }));
        React.useEffect(() => {
          props.onCanSubmitChange(true);
        }, [props.onCanSubmitChange]);
        return null;
      }
    ),
  };
});
jest.mock(
  "@/components/waves/create-wave/services/createWaveDropRequest",
  () => ({
    getCreateWaveDropRequest: async () => ({
      title: null,
      parts: mockSnapshot.parts,
      metadata: [],
      referenced_nfts: [],
      mentioned_users: [],
      signature: null,
    }),
  })
);
jest.mock("@/services/api/competitions-api", () => ({
  competitionScope: () => ({}),
  createCompetitionEntry: jest.fn().mockResolvedValue({ id: "entry" }),
  invalidateCompetition: jest.fn().mockResolvedValue(undefined),
}));

it("preserves wave and group mentions in the competition submission command and strips legacy signing fields", async () => {
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
  await waitFor(() => expect(createCompetitionEntry).toHaveBeenCalled());
  const body = jest.mocked(createCompetitionEntry).mock.calls[0]![1];
  expect(body.drop).toMatchObject({
    wave_id: "wave",
    drop_type: "PARTICIPATORY",
    mentioned_waves: mockSnapshot.mentioned_waves,
    mentioned_groups: ["ADMINS"],
    hide_link_preview: true,
    signature: null,
  });
  expect(body.drop).not.toHaveProperty("signer_address");
  expect(body.drop).not.toHaveProperty("is_safe_signature");
});

afterEach(() => {
  mockRequiredMetadata = [];
  mockTerms = null;
});

it("gives blank metadata requirements an accessible fallback name", () => {
  mockRequiredMetadata = [{ name: " ", type: "NUMBER" }];
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  const field = screen.getByRole("spinbutton", {
    name: "Required information 1",
  });
  expect(field).toBeRequired();
  fireEvent.change(field, { target: { value: "1" } });
  fireEvent.change(field, { target: { value: "" } });
  expect(field).toHaveAttribute("aria-invalid", "true");
});

it("keeps submission terms separate from the checkbox accessible name", () => {
  mockTerms = "The complete competition participation terms.";
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  const checkbox = screen.getByRole("checkbox", {
    name: "I agree to this competition’s terms.",
  });
  expect(checkbox).toHaveAccessibleDescription(mockTerms);
  expect(screen.getByText(mockTerms).closest("label")).toBeNull();
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
});
