import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateDropWrapper from "@/components/drops/create/utils/CreateDropWrapper";
import { WalletValidationError } from "@/src/errors/wallet";
import {
  CreateDropType,
  CreateDropViewType,
} from "@/components/drops/create/types";

// Mock the SeizeConnectContext
const mockUseSeizeConnectContext = jest.fn();
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext(),
}));

// Mock react-use breakpoint
jest.mock("react-use", () => ({
  createBreakpoint: () => () => "LG",
}));

let mockMarkdown = "";
const mockExportDropMarkdown = jest.fn(() => mockMarkdown);

// Mock markdown utilities
jest.mock("@/components/waves/drops/normalizeDropMarkdown", () => ({
  __esModule: true,
  default: (value: string) => value,
  normalizeDropMarkdown: (value: string) => value,
  exportDropMarkdown: () => mockExportDropMarkdown(),
}));

// Mock transformers
jest.mock(
  "@/components/drops/create/lexical/transformers/MentionTransformer",
  () => ({
    MENTION_TRANSFORMER: {},
  })
);

jest.mock(
  "@/components/drops/create/lexical/transformers/HastagTransformer",
  () => ({
    HASHTAG_TRANSFORMER: {},
  })
);

jest.mock(
  "@/components/drops/create/lexical/transformers/ImageTransformer",
  () => ({
    IMAGE_TRANSFORMER: {},
  })
);

// Mock components
jest.mock("@/components/drops/create/compact/CreateDropCompact", () => {
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      clearEditorState: jest.fn(),
    }));

    return (
      <div data-testid="create-drop-compact">
        Compact View
        <button
          data-testid="set-compact-editor-state"
          onClick={() => props.onEditorState({})}
          type="button"
        >
          Set editor
        </button>
      </div>
    );
  });
});

jest.mock("@/components/drops/create/full/CreateDropFull", () => {
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      clearEditorState: jest.fn(),
    }));

    return (
      <div data-testid="create-drop-full">
        Full View
        <button
          data-testid="set-full-editor-state"
          onClick={() => props.onEditorState({})}
          type="button"
        >
          Set editor
        </button>
        <button
          data-testid="add-full-part"
          onClick={() => props.onDropPart()}
          type="button"
        >
          Add part
        </button>
      </div>
    );
  });
});

jest.mock("@/components/utils/animation/CommonAnimationHeight", () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

describe("CreateDropWrapper Authentication Validation", () => {
  let queryClient: QueryClient;

  const mockProfile = {
    id: "test-profile",
    handle: "testuser",
    pfp: null,
    cic: 0,
    rep: 0,
    tdh: 0,
    level: 1,
    consolidation: {
      id: "1",
      classification: "test",
      balance_tdh: 0,
      primary_wallet: "0x1234567890123456789012345678901234567890",
      wallets: [],
      tdh: 0,
      rep: 0,
      cic: 0,
      level: 1,
      consolidation_display: "test",
      consolidation_key: "test",
    },
  };

  const defaultProps = {
    profile: mockProfile,
    quotedDrop: null,
    type: CreateDropType.DROP,
    loading: false,
    title: null,
    metadata: [],
    mentionedUsers: [],
    mentionedWaves: [],
    referencedNfts: [],
    drop: null,
    viewType: CreateDropViewType.COMPACT,
    showSubmit: true,
    wave: null,
    waveId: null,
    children: null,
    setIsStormMode: jest.fn(),
    setViewType: jest.fn(),
    setDrop: jest.fn(),
    setMentionedUsers: jest.fn(),
    onMentionedUser: jest.fn(),
    onMentionedWave: jest.fn(),
    setReferencedNfts: jest.fn(),
    setTitle: jest.fn(),
    setMetadata: jest.fn(),
    onSubmitDrop: jest.fn(),
  };

  beforeEach(() => {
    mockMarkdown = "";
    mockExportDropMarkdown.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateDropWrapper {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe("Authentication validation - fail-fast behavior", () => {
    it("throws when wallet is not authenticated", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: false,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      // Mock console.error to suppress error output in test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderComponent();
      }).toThrow(
        "Wallet validation failed: Authentication required for drop creation. Please connect and authenticate your wallet."
      );

      consoleSpy.mockRestore();
    });

    it("throws when authenticated wallet address is missing", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: undefined,
        isSafeWallet: false,
      });

      // Mock console.error to suppress error output in test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderComponent();
      }).toThrow(
        "Wallet validation failed: Authenticated wallet address is missing. Please reconnect your wallet."
      );

      consoleSpy.mockRestore();
    });

    it("throws when address is null", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: null,
        isSafeWallet: false,
      });

      // Mock console.error to suppress error output in test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderComponent();
      }).toThrow(
        "Wallet validation failed: Authenticated wallet address is missing. Please reconnect your wallet."
      );

      consoleSpy.mockRestore();
    });

    it("throws when address is empty string", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "",
        isSafeWallet: false,
      });

      // Mock console.error to suppress error output in test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderComponent();
      }).toThrow(
        "Wallet validation failed: Authenticated wallet address is missing. Please reconnect your wallet."
      );

      consoleSpy.mockRestore();
    });

    it("renders successfully when properly authenticated", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const { getByTestId } = renderComponent();

      expect(getByTestId("create-drop-compact")).toBeInTheDocument();
    });

    it("works with Safe wallets when properly authenticated", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: true,
      });

      const { getByTestId } = renderComponent();

      expect(getByTestId("create-drop-compact")).toBeInTheDocument();
    });
  });

  describe("Integration with drop creation", () => {
    it("uses address directly for signer_address when authenticated", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const component = React.createRef<any>();
      render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper ref={component} {...defaultProps} />
        </QueryClientProvider>
      );

      let result: any;
      act(() => {
        result = component.current?.requestDrop();
      });

      expect(result).toMatchObject({
        signer_address: "0x1234567890123456789012345678901234567890",
        is_safe_signature: false,
        signature: null,
        title: null,
        parts: [],
        mentioned_users: [],
        referenced_nfts: [],
        metadata: [],
      });
    });

    it("maintains Safe wallet flag in drop configuration", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: true,
      });

      const component = React.createRef<any>();
      render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper ref={component} {...defaultProps} />
        </QueryClientProvider>
      );

      let result: any;
      act(() => {
        result = component.current?.requestDrop();
      });

      expect(result.is_safe_signature).toBe(true);
      expect(result.signer_address).toBe(
        "0x1234567890123456789012345678901234567890"
      );
    });

    it("getDropSnapshot returns current editor content without calling setDrop", () => {
      mockMarkdown = "draft text @[alice] #[Wave One] $[Token One]";
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const metadata = { data_key: "format", data_value: "markdown" };
      const mentionedUser = {
        mentioned_profile_id: "profile-1",
        handle_in_content: "alice",
      };
      const mentionedWave = {
        wave_id: "wave-1",
        wave_name_in_content: "Wave One",
      };
      const referencedNft = {
        contract: "0xabc",
        token: "1",
        name: "Token One",
      };
      const setDrop = jest.fn();
      const component = React.createRef<any>();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            ref={component}
            {...defaultProps}
            title="Draft title"
            metadata={[metadata]}
            mentionedUsers={[mentionedUser]}
            mentionedWaves={[mentionedWave]}
            referencedNfts={[referencedNft]}
            setDrop={setDrop}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      fireEvent.click(getByTestId("set-full-editor-state"));

      const result = component.current?.getDropSnapshot();

      expect(setDrop).not.toHaveBeenCalled();
      expect(result.parts).toEqual([
        {
          content: "draft text @[alice] #[Wave One] $[Token One]",
          quoted_drop: null,
          media: [],
        },
      ]);
      expect(result).toMatchObject({
        title: "Draft title",
        metadata: [metadata],
        mentioned_users: [mentionedUser],
        mentioned_waves: [mentionedWave],
        referenced_nfts: [referencedNft],
        signature: null,
        is_safe_signature: false,
        signer_address: "0x1234567890123456789012345678901234567890",
      });
    });

    it("getDropSnapshot includes existing storm parts plus current draft once", () => {
      mockMarkdown = "second part";
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const existingPart = {
        content: "first part",
        quoted_drop: null,
        media: [],
      };
      const drop = {
        title: null,
        parts: [existingPart],
        mentioned_users: [],
        mentioned_waves: [],
        referenced_nfts: [],
        metadata: [],
        signature: null,
      };
      const setDrop = jest.fn();
      const component = React.createRef<any>();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            ref={component}
            {...defaultProps}
            drop={drop as any}
            setDrop={setDrop}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      fireEvent.click(getByTestId("set-full-editor-state"));

      const firstSnapshot = component.current?.getDropSnapshot();
      const secondSnapshot = component.current?.getDropSnapshot();

      expect(setDrop).not.toHaveBeenCalled();
      expect(drop.parts).toHaveLength(1);
      expect(firstSnapshot.parts.map((part: any) => part.content)).toEqual([
        "first part",
        "second part",
      ]);
      expect(secondSnapshot.parts.map((part: any) => part.content)).toEqual([
        "first part",
        "second part",
      ]);
    });

    it("requestDrop still calls setDrop", () => {
      mockMarkdown = "saved draft";
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const setDrop = jest.fn();
      const component = React.createRef<any>();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            ref={component}
            {...defaultProps}
            setDrop={setDrop}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      fireEvent.click(getByTestId("set-full-editor-state"));
      let result: any;
      act(() => {
        result = component.current?.requestDrop();
      });

      expect(setDrop).toHaveBeenCalledWith(result);
      expect(result.parts[0].content).toBe("saved draft");
    });

    it("ignores editor state and storm part changes while loading", () => {
      mockMarkdown = "locked draft";
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const setDrop = jest.fn();
      const component = React.createRef<any>();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            ref={component}
            {...defaultProps}
            loading={true}
            setDrop={setDrop}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      fireEvent.click(getByTestId("set-full-editor-state"));
      fireEvent.click(getByTestId("add-full-part"));

      const result = component.current?.getDropSnapshot();

      expect(setDrop).not.toHaveBeenCalled();
      expect(result.parts).toEqual([]);
    });
  });
});
