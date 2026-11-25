import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import CompetitionEntryForm from "@/components/competitions/CompetitionEntryForm";
import { getCreateWaveDropRequest } from "@/components/waves/create-wave/services/createWaveDropRequest";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { createCompetitionEntry } from "@/services/api/competitions-api";

let mockRequiredMetadata: Array<{ name: string; type: string }> = [];
let mockTerms: string | null = null;
let mockAnonymousSubmissions = false;
let mockSignatureRequired = false;
let mockSubmitPermission = true;
let mockCompetitionOrigin: Record<string, unknown> = {};
const mockSign = jest.fn();
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
const mockSaveReceipt = jest.fn();
const mockDropEditorProps = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ isError: false }),
  useQueryClient: () => ({
    setQueryData: mockSaveReceipt,
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
        anonymous_submissions: mockAnonymousSubmissions,
        required_metadata: mockRequiredMetadata,
        required_media: [],
        signature_required: mockSignatureRequired,
        terms: mockTerms,
      },
      permissions: { submit: mockSubmitPermission },
      ...mockCompetitionOrigin,
    },
  }),
}));
const mockChainEntrySubmit = jest.fn();
let mockChainEntriesActive = false;
jest.mock("@/components/chain-waves/useChainEntryWriters", () => ({
  useChainEntrySubmit: () =>
    mockChainEntriesActive ? mockChainEntrySubmit : null,
  invalidateChainEntryQueries: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/chain-identity/active", () => ({
  ...jest.requireActual("@/lib/chain-identity/active"),
  isChainIdentityActive: jest.fn(() => false),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "author:self",
}));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  ...jest.requireActual("@/hooks/competitions/useCompetitionSignature"),
  useCompetitionSignature: () => mockSign,
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
        props: {
          onCanSubmitChange: (ready: boolean) => void;
          mediaUploadPurpose?: ApiMediaUploadPurpose;
        },
        ref: React.Ref<unknown>
      ) => {
        mockDropEditorProps(props);
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
    getCreateWaveDropRequest: jest.fn(async () => ({
      title: null,
      parts: mockSnapshot.parts,
      metadata: [],
      referenced_nfts: [],
      mentioned_users: [],
      signature: null,
    })),
  })
);
jest.mock("@/services/api/competitions-api", () => ({
  competitionScope: () => ({}),
  createCompetitionEntry: jest.fn().mockResolvedValue({ id: "entry" }),
  invalidateCompetition: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  mockAnonymousSubmissions = false;
  mockSignatureRequired = false;
});

it("explains winner disclosure before submitting an anonymous entry", () => {
  mockAnonymousSubmissions = true;
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  expect(
    screen.getByText(
      "Your identity will be revealed automatically if this submission wins. Information you include in the submission or its metadata remains visible."
    )
  ).toBeInTheDocument();
});

it("explains how to recover when an older upload cannot be submitted anonymously", async () => {
  mockAnonymousSubmissions = true;
  jest.mocked(createCompetitionEntry).mockRejectedValueOnce({
    status: 400,
    response: {
      body: { code: "ANONYMOUS_SUBMISSION_MEDIA_REUPLOAD_REQUIRED" },
    },
  });
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Upload your media again, then retry this anonymous submission."
  );
});

it("says the wallet did not complete the signature when signing fails", async () => {
  mockSignatureRequired = true;
  mockSign.mockRejectedValueOnce(new Error("Request expired"));
  const callsBefore = jest.mocked(createCompetitionEntry).mock.calls.length;
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Your wallet didn’t complete the signature.");
  expect(alert).toHaveTextContent("Your input has been preserved.");
  expect(createCompetitionEntry).toHaveBeenCalledTimes(callsBefore);
});

it("reads a wallet's own rejection as a cancelled signature", async () => {
  mockSignatureRequired = true;
  mockSign.mockRejectedValueOnce({ code: 4001 });
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The wallet signature was cancelled."
  );
});

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
  expect(mockSaveReceipt).toHaveBeenCalledWith(
    expect.arrayContaining(["submission-receipt", "entry"]),
    { id: "entry" }
  );
});

it("uploads the entry's media as a decision entry, which keeps the original file", async () => {
  // Mocks are not cleared between tests in this file, so only calls made by
  // this test count.
  mockDropEditorProps.mockClear();
  jest.mocked(getCreateWaveDropRequest).mockClear();
  render(<CompetitionEntryForm onClose={jest.fn()} />);
  expect(mockDropEditorProps).toHaveBeenLastCalledWith(
    expect.objectContaining({
      mediaUploadPurpose: ApiMediaUploadPurpose.DecisionEntry,
    })
  );
  expect(getCreateWaveDropRequest).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
  await waitFor(() =>
    expect(getCreateWaveDropRequest).toHaveBeenCalledTimes(1)
  );
  expect(jest.mocked(getCreateWaveDropRequest).mock.lastCall).toEqual([
    mockSnapshot,
    ApiMediaUploadPurpose.DecisionEntry,
  ]);
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
    name: "I agree to this decision’s terms.",
  });
  expect(checkbox).toHaveAccessibleDescription(mockTerms);
  expect(screen.getByText(mockTerms).closest("label")).toBeNull();
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
});

describe("on the 6529 Network", () => {
  beforeEach(() => {
    mockChainEntriesActive = true;
    mockChainEntrySubmit.mockReset().mockResolvedValue({ entryId: "0xentry" });
    jest.mocked(createCompetitionEntry).mockClear();
  });

  afterEach(() => {
    mockChainEntriesActive = false;
  });

  it("sends the entry there, not to 6529.io's competition route", async () => {
    const onClose = jest.fn();
    render(<CompetitionEntryForm onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockChainEntrySubmit).toHaveBeenCalledWith({
      request: expect.objectContaining({
        wave_id: "wave",
        drop_type: "PARTICIPATORY",
        mentioned_groups: ["ADMINS"],
        signature: null,
      }),
      terms: null,
      onStage: expect.any(Function),
    });
    expect(createCompetitionEntry).not.toHaveBeenCalled();
  });

  it("says where the entry stands, and says it is sending only once it is", async () => {
    let finish!: () => void;
    mockChainEntrySubmit.mockImplementation(
      ({ onStage }: { onStage: (stage: string) => void }) =>
        new Promise((resolve) => {
          onStage("preparing");
          finish = () => resolve({ entryId: "0xentry" });
        })
    );
    const onClose = jest.fn();
    render(<CompetitionEntryForm onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Getting your entry ready."
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("Sending");
    const { onStage } = mockChainEntrySubmit.mock.calls[0][0];
    act(() => onStage("wallet"));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for your wallet."
    );
    act(() => onStage("sending"));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sending to the 6529 Network."
    );
    act(() => finish());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("says an entry that isn't final yet was sent and offers no second send", async () => {
    const { ChainEntryPendingError } = jest.requireActual(
      "@/lib/chain-waves/entryWriters"
    );
    mockChainEntrySubmit.mockRejectedValue(
      new ChainEntryPendingError(
        "Your entry was sent to the 6529 Network but isn't final yet.",
        null
      )
    );
    render(<CompetitionEntryForm onClose={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Submit an entry" });
    fireEvent.click(button);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your entry was sent to the 6529 Network but isn't final yet."
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() => expect(button).toBeDisabled());
  });

  it("shows no failure when the wallet prompt is declined", async () => {
    mockChainEntrySubmit.mockRejectedValue(
      Object.assign(new Error("User rejected"), { code: 4001 })
    );
    render(<CompetitionEntryForm onClose={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Submit an entry" });
    fireEvent.click(button);
    await waitFor(() => expect(mockChainEntrySubmit).toHaveBeenCalled());
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  describe("from a wallet with no identity on the 6529 Network", () => {
    /** The entry stops where the chain writer looks up the wallet. */
    const entryWithoutIdentity = () => {
      const { chainGateway } = jest.requireActual(
        "@/lib/chain-identity/gateway"
      );
      const { identityOfWallet } = jest.requireActual(
        "@/lib/chain-waves/signing"
      );
      jest.spyOn(chainGateway, "getIdentityByWallet").mockResolvedValue(null);
      return identityOfWallet(`0x${"12".repeat(20)}`);
    };
    const { isChainIdentityActive } = jest.requireMock(
      "@/lib/chain-identity/active"
    );

    beforeEach(() => {
      mockChainEntrySubmit.mockImplementation(entryWithoutIdentity);
    });
    afterEach(() => {
      isChainIdentityActive.mockReturnValue(false);
      jest.restoreAllMocks();
    });

    it("points to the identity page once it takes changes", async () => {
      isChainIdentityActive.mockReturnValue(true);
      render(<CompetitionEntryForm onClose={jest.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This wallet has no identity on the 6529 Network yet. Set one up on your identity page."
      );
      expect(
        screen.getByRole("link", { name: "your identity page" })
      ).toHaveAttribute("href", "/network/identity");
      expect(createCompetitionEntry).not.toHaveBeenCalled();
    });

    it("keeps the plain line while the identity page can't help", async () => {
      render(<CompetitionEntryForm onClose={jest.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This wallet has no identity on the 6529 Network yet."
      );
      expect(
        screen.queryByRole("link", { name: "your identity page" })
      ).not.toBeInTheDocument();
    });
  });

  it("says what the 6529 Network refused", async () => {
    const { ChainOperationError } = jest.requireActual(
      "@/lib/chain-identity/operation"
    );
    mockChainEntrySubmit.mockRejectedValue(
      new ChainOperationError(
        "rejected",
        "This decision isn't taking entries right now."
      )
    );
    render(<CompetitionEntryForm onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This decision isn't taking entries right now."
    );
    expect(createCompetitionEntry).not.toHaveBeenCalled();
  });

  it("says a refusal from a block still paid its fee, in plain words", async () => {
    const { ChainOperationError } = jest.requireActual(
      "@/lib/chain-identity/operation"
    );
    mockChainEntrySubmit.mockRejectedValue(
      new ChainOperationError(
        "failed",
        "The 6529 Network refused this change: PARTICIPATION_CLOSED.",
        "PARTICIPATION_CLOSED"
      )
    );
    render(<CompetitionEntryForm onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "The change didn't go through, and its fee was still charged. This decision isn't taking entries right now."
    );
    expect(alert).not.toHaveTextContent("PARTICIPATION_CLOSED");
  });

  describe("a decision made there", () => {
    const CHAIN_ID = `0x${"3c".repeat(32)}`;

    afterEach(() => {
      mockSubmitPermission = true;
      mockCompetitionOrigin = {};
    });

    it("says what the network refused when the viewer can't enter", async () => {
      const { ChainOperationError } = jest.requireActual(
        "@/lib/chain-identity/operation"
      );
      mockCompetitionOrigin = { chain_id: CHAIN_ID };
      mockChainEntrySubmit.mockRejectedValue(
        new ChainOperationError(
          "rejected",
          "You aren't in the group that can enter this decision."
        )
      );
      render(<CompetitionEntryForm onClose={jest.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Submit an entry" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "You aren't in the group that can enter this decision."
      );
    });

    it("keeps 6529.io's closed submissions, as for an imported decision", () => {
      mockSubmitPermission = false;
      mockCompetitionOrigin = { chain_id: CHAIN_ID };
      render(<CompetitionEntryForm onClose={jest.fn()} />);
      expect(
        screen.getByText(
          "Entries are currently closed or you are not eligible to submit."
        )
      ).toBeInTheDocument();
      const button = screen.getByRole("button", { name: "Submit an entry" });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(mockChainEntrySubmit).not.toHaveBeenCalled();
    });
  });
});
