import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
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
      <div
        data-can-add-part={props.canAddPart}
        data-can-submit={props.canSubmit}
        data-submit-on-enter={props.submitOnEnter}
        data-testid="create-drop-compact"
      >
        Compact View
        <button
          data-testid="set-compact-editor-state"
          onClick={() => props.onEditorState({})}
          type="button"
        >
          Set editor
        </button>
        <button
          data-testid="sync-compact-upload-editor-state"
          onClick={() => props.onUploadEditorStateChange({})}
          type="button"
        >
          Sync upload editor
        </button>
        <button
          data-testid="submit-compact-drop"
          onClick={() => props.onDrop()}
          type="button"
        >
          Submit drop
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
      <div
        data-can-add-part={props.canAddPart}
        data-can-submit={props.canSubmit}
        data-submit-on-enter={props.submitOnEnter}
        data-testid="create-drop-full"
      >
        Full View
        <button
          data-testid="set-full-editor-state"
          onClick={() => props.onEditorState({})}
          type="button"
        >
          Set editor
        </button>
        <button
          data-testid="sync-full-upload-editor-state"
          onClick={() => props.onUploadEditorStateChange({})}
          type="button"
        >
          Sync upload editor
        </button>
        <button
          data-testid="add-full-part"
          onClick={() => props.onDropPart()}
          type="button"
        >
          Add part
        </button>
        <button
          data-testid="submit-full-drop"
          onClick={() => props.onDrop()}
          type="button"
        >
          Submit drop
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

    it("passes submitOnEnter true by default", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const { getByTestId } = renderComponent();

      expect(getByTestId("create-drop-compact")).toHaveAttribute(
        "data-submit-on-enter",
        "true"
      );
    });

    it("passes explicit submitOnEnter false to compact and full views", () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const compact = renderComponent({ submitOnEnter: false });

      expect(compact.getByTestId("create-drop-compact")).toHaveAttribute(
        "data-submit-on-enter",
        "false"
      );

      compact.unmount();

      const full = renderComponent({
        submitOnEnter: false,
        viewType: CreateDropViewType.FULL,
      });

      expect(full.getByTestId("create-drop-full")).toHaveAttribute(
        "data-submit-on-enter",
        "false"
      );
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
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toMatchObject({
        content: "draft text @[alice] #[Wave One] $[Token One]",
        quoted_drop: null,
        media: [],
      });
      expect(result.parts[0].clientId).toEqual(expect.any(String));
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
        clientId: "existing-part",
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
      expect(firstSnapshot.parts[0].clientId).toBe("existing-part");
      expect(firstSnapshot.parts[1].clientId).toEqual(expect.any(String));
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

    it("syncs upload editor state while loading", () => {
      mockMarkdown = "uploaded ![Seize](https://cdn.example/image.png)";
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

      fireEvent.click(getByTestId("sync-full-upload-editor-state"));

      const result = component.current?.getDropSnapshot();

      expect(setDrop).not.toHaveBeenCalled();
      expect(result.parts[0].content).toBe(
        "uploaded ![Seize](https://cdn.example/image.png)"
      );
    });

    it("disables adding a storm part while inline image upload markdown is pending", async () => {
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const component = React.createRef<any>();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            ref={component}
            {...defaultProps}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      mockMarkdown = "ready part";
      fireEvent.click(getByTestId("set-full-editor-state"));

      await waitFor(() => {
        expect(getByTestId("create-drop-full")).toHaveAttribute(
          "data-can-add-part",
          "true"
        );
      });

      mockMarkdown = "pending ![Seize](loading)";
      fireEvent.click(getByTestId("set-full-editor-state"));

      await waitFor(() => {
        expect(getByTestId("create-drop-full")).toHaveAttribute(
          "data-can-add-part",
          "false"
        );
      });
    });

    it("does not save a storm part while inline image upload markdown is pending", () => {
      mockMarkdown = "pending ![Seize](loading)";
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const setDrop = jest.fn();
      const setIsStormMode = jest.fn();
      const component = React.createRef<any>();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            ref={component}
            {...defaultProps}
            setDrop={setDrop}
            setIsStormMode={setIsStormMode}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      fireEvent.click(getByTestId("set-full-editor-state"));
      fireEvent.click(getByTestId("add-full-part"));

      const result = component.current?.getDropSnapshot();

      expect(setDrop).not.toHaveBeenCalled();
      expect(setIsStormMode).not.toHaveBeenCalled();
      expect(result.parts[0].content).toBe("pending ![Seize](loading)");
    });

    it("does not submit while inline image upload markdown is pending", async () => {
      mockMarkdown = "pending ![Seize](loading)";
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const setDrop = jest.fn();
      const onSubmitDrop = jest.fn();
      const component = React.createRef<any>();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            ref={component}
            {...defaultProps}
            setDrop={setDrop}
            onSubmitDrop={onSubmitDrop}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      fireEvent.click(getByTestId("set-full-editor-state"));

      await waitFor(() => {
        expect(getByTestId("create-drop-full")).toHaveAttribute(
          "data-can-submit",
          "false"
        );
      });

      fireEvent.click(getByTestId("submit-full-drop"));

      const result = component.current?.getDropSnapshot();

      expect(setDrop).not.toHaveBeenCalled();
      expect(onSubmitDrop).not.toHaveBeenCalled();
      expect(result.parts[0].content).toBe("pending ![Seize](loading)");
    });

    it("saves a storm part once inline image markdown has an uploaded URL", () => {
      mockMarkdown = "ready ![Seize](https://cdn.example/image.png)";
      mockUseSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        address: "0x1234567890123456789012345678901234567890",
        isSafeWallet: false,
      });

      const setDrop = jest.fn();
      const setIsStormMode = jest.fn();
      const { getByTestId } = render(
        <QueryClientProvider client={queryClient}>
          <CreateDropWrapper
            {...defaultProps}
            setDrop={setDrop}
            setIsStormMode={setIsStormMode}
            viewType={CreateDropViewType.FULL}
          />
        </QueryClientProvider>
      );

      fireEvent.click(getByTestId("set-full-editor-state"));
      fireEvent.click(getByTestId("add-full-part"));

      expect(setIsStormMode).toHaveBeenCalledWith(true);
      expect(setDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          parts: [
            expect.objectContaining({
              content: "ready ![Seize](https://cdn.example/image.png)",
            }),
          ],
        })
      );
    });
  });
});
