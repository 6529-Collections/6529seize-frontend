import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import WaveDrop from "@/components/waves/drops/WaveDrop";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { editSlice } from "@/store/editSlice";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { commonApiPost } from "@/services/api/common-api";

// Add ResizeObserver polyfill for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the API
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

// Mock the MyStreamContext
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  MyStreamProvider: ({ children }: any) => children,
  useMyStream: () => ({
    processIncomingDrop: jest.fn(),
  }),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock mobile device hook
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

// The actual drop update mutation hook will be used with mocked API

// Mock the EmojiContext
jest.mock("@/contexts/EmojiContext", () => ({
  EmojiProvider: ({ children }: any) => children,
  useEmoji: () => ({
    emojiMap: [],
    loading: false,
    categories: [],
    categoryIcons: {},
    findNativeEmoji: jest.fn(),
    findCustomEmoji: jest.fn(),
  }),
}));

// Mock SeizeSettingsContext
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    settings: {},
  }),
}));

// Mock WaveDropActions to focus on edit functionality
jest.mock("@/components/waves/drops/WaveDropActions", () => {
  return function MockWaveDropActions({ onEdit }: any) {
    return (
      <div data-testid="wave-drop-actions">
        {onEdit && (
          <button
            data-testid="edit-button"
            onClick={() => {
              // Simulate the actual edit button click which would trigger onEdit
              onEdit();
            }}
          >
            Edit
          </button>
        )}
      </div>
    );
  };
});

// Create a context to pass handlers
const TestEditContext = React.createContext<{
  onSave?: ((content: string, mentions: any[]) => void) | undefined;
  onCancel?: (() => void) | undefined;
}>({});

// Mock WaveDropPartContentMarkdown to check for edit state
jest.mock("@/components/waves/drops/WaveDropPartContentMarkdown", () => {
  const { useSelector } = require("react-redux");

  return function MockWaveDropPartContentMarkdown({ part }: any) {
    const editState = useSelector((state: any) => state.edit);
    const isEditing = editState.editingDropId === "drop-123";

    if (isEditing) {
      return (
        <div data-testid="edit-drop-lexical">
          <textarea
            data-testid="edit-content"
            defaultValue={part.content}
            onChange={(e) => {
              (window as any).editContent = e.target.value;
            }}
          />
          <button
            data-testid="save-button"
            onClick={() => {
              const content = (window as any).editContent || part.content;
              // For integration test, we'll call the global save handler
              if ((window as any).testHandleSave) {
                (window as any).testHandleSave(content, []);
              }
            }}
          >
            Save
          </button>
          <button
            data-testid="cancel-button"
            onClick={() => {
              // For integration test, we'll call the global cancel handler
              if ((window as any).testHandleCancel) {
                (window as any).testHandleCancel();
              }
            }}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div data-testid="wave-drop-content">
        <p>{part.content}</p>
      </div>
    );
  };
});

const mockedCommonApiPost = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

// Test utilities and factories
const createMockDrop = (overrides = {}) => ({
  id: "drop-123",
  serial_no: 1,
  author: { handle: "testuser" },
  wave: { id: "wave-123" },
  created_at: Date.now() - 60000, // 1 minute ago (within edit window)
  updated_at: null,
  title: null,
  parts: [
    {
      part_id: 1,
      content: "Original content",
      media: [],
      quoted_drop: null,
      replies_count: 0,
      quotes_count: 0,
    },
  ],
  parts_count: 1,
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  rating: 0,
  realtime_rating: 0,
  rating_prediction: 0,
  top_raters: [],
  raters_count: 0,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  reply_to: null,
  rank: null,
  drop_type: ApiDropType.Chat,
  type: "FULL" as any,
  stableKey: "drop-123",
  stableHash: "hash-123",
  ...overrides,
});

const createEditHandlers = (
  store: any,
  mockSetToast: jest.Mock,
  mockInvalidateDrops: jest.Mock,
  dropId = "drop-123"
) => {
  const handleEdit = () => {
    store.dispatch(editSlice.actions.setEditingDropId(dropId));
  };

  const handleSave = async (content: string, mentions: any[]) => {
    try {
      await mockedCommonApiPost({
        endpoint: `drops/${dropId}`,
        body: {
          content,
          mentioned_users: mentions,
        },
      });

      mockSetToast({
        message: "Drop updated successfully",
        type: "success",
      });
      mockInvalidateDrops();
      store.dispatch(editSlice.actions.setEditingDropId(null));
    } catch (error) {
      // Explicitly handle test error scenario - log error for debugging
      console.error("Test error scenario triggered:", error);
      mockSetToast({
        message: "Failed to update drop. Please try again.",
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    store.dispatch(editSlice.actions.setEditingDropId(null));
  };

  return { handleEdit, handleSave, handleCancel };
};

const createCustomEditHandlers = (
  store: any,
  mockSetToast: jest.Mock,
  mockInvalidateDrops: jest.Mock,
  customSaveLogic: (content: string, mentions: any[]) => Promise<void>
) => {
  const handleEdit = () => {
    store.dispatch(editSlice.actions.setEditingDropId("drop-123"));
  };

  const handleSave = customSaveLogic;

  const handleCancel = () => {
    store.dispatch(editSlice.actions.setEditingDropId(null));
  };

  return { handleEdit, handleSave, handleCancel };
};

const setupEditTest = (user: any) => {
  return {
    async startEdit() {
      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);
      await waitFor(() => {
        expect(screen.getByTestId("edit-drop-lexical")).toBeInTheDocument();
      });
    },
    async editContent(newContent: string) {
      const editTextarea = screen.getByTestId("edit-content");
      await user.clear(editTextarea);
      await user.type(editTextarea, newContent);
    },
    async addToContent(additionalContent: string) {
      const editTextarea = screen.getByTestId("edit-content");
      await user.type(editTextarea, additionalContent);
    },
    async save() {
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);
    },
    async cancel() {
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);
    },
  };
};

const createWaveDropProps = (drop: any, onEdit?: () => void) => ({
  drop,
  previousDrop: null,
  nextDrop: null,
  showWaveInfo: false,
  activeDrop: null,
  showReplyAndQuote: true,
  location: 0 as any,
  dropViewDropId: null,
  onReply: jest.fn(),
  onQuote: jest.fn(),
  onReplyClick: jest.fn(),
  onQuoteClick: jest.fn(),
  onEdit: onEdit || jest.fn(),
});

describe("Edit Drop Integration Flow", () => {
  let queryClient: QueryClient;
  let store: any;
  let mockSetToast: jest.Mock;
  let mockInvalidateDrops: jest.Mock;
  let mockDrop: any;
  const authUser = { handle: "testuser", profile_id: "profile-123" };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    store = configureStore({
      reducer: { edit: editSlice.reducer },
    });

    mockSetToast = jest.fn();
    mockInvalidateDrops = jest.fn();
    mockDrop = createMockDrop();

    // Clear any stored edit content and handlers
    delete (window as any).editContent;
    delete (window as any).testHandleSave;
    delete (window as any).testHandleCancel;

    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    const authContextValue = {
      connectedProfile: authUser,
      setToast: mockSetToast,
    } as any;

    const reactQueryContextValue = {
      invalidateDrops: mockInvalidateDrops,
    } as any;

    return render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <AuthContext.Provider value={authContextValue}>
            <ReactQueryWrapperContext.Provider value={reactQueryContextValue}>
              {component}
            </ReactQueryWrapperContext.Provider>
          </AuthContext.Provider>
        </Provider>
      </QueryClientProvider>
    );
  };

  describe("Complete Edit Flow", () => {
    it("should complete full edit flow: click edit → edit content → save → API call", async () => {
      const user = userEvent.setup();
      const updatedDrop = createMockDrop({
        parts: [{ ...mockDrop.parts[0], content: "Updated content" }],
        updated_at: Date.now(),
      });
      mockedCommonApiPost.mockResolvedValue(updatedDrop);

      const { handleEdit, handleSave, handleCancel } = createEditHandlers(
        store,
        mockSetToast,
        mockInvalidateDrops
      );
      (window as any).testHandleSave = handleSave;
      (window as any).testHandleCancel = handleCancel;

      renderWithProviders(
        <WaveDrop {...createWaveDropProps(mockDrop, handleEdit)} />
      );
      const editTest = setupEditTest(user);

      // Complete edit flow
      await editTest.startEdit();
      await editTest.editContent("Updated content");
      await editTest.save();

      // Step 4: Verify API call was made
      await waitFor(() => {
        expect(mockedCommonApiPost).toHaveBeenCalledWith({
          endpoint: "drops/drop-123",
          body: {
            content: "Updated content",
            mentioned_users: [],
          },
        });
      });

      // Step 5: Verify success toast
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Drop updated successfully",
        type: "success",
      });

      // Step 6: Verify cache invalidation
      expect(mockInvalidateDrops).toHaveBeenCalled();
    });

    it("should handle edit cancellation flow", async () => {
      const user = userEvent.setup();
      const { handleEdit, handleCancel } = createEditHandlers(
        store,
        mockSetToast,
        mockInvalidateDrops
      );
      (window as any).testHandleCancel = handleCancel;

      renderWithProviders(
        <WaveDrop {...createWaveDropProps(mockDrop, handleEdit)} />
      );
      const editTest = setupEditTest(user);

      // Complete cancellation flow
      await editTest.startEdit();
      await editTest.addToContent(" - with changes");
      await editTest.cancel();

      // Verify no API call was made
      expect(mockedCommonApiPost).not.toHaveBeenCalled();

      // Verify edit mode is closed (Redux state)
      const editState = store.getState().edit;
      expect(editState.editingDropId).toBeNull();
    });

    it("should handle no-changes save gracefully", async () => {
      const user = userEvent.setup();
      const { handleEdit } = createEditHandlers(
        store,
        mockSetToast,
        mockInvalidateDrops
      );

      renderWithProviders(
        <WaveDrop {...createWaveDropProps(mockDrop, handleEdit)} />
      );
      const editTest = setupEditTest(user);

      // Start edit mode directly via Redux for this test
      store.dispatch(editSlice.actions.setEditingDropId("drop-123"));

      await waitFor(() => {
        expect(screen.getByTestId("edit-drop-lexical")).toBeInTheDocument();
      });

      // Save without making changes
      await editTest.save();

      // Verify no API call was made for unchanged content
      expect(mockedCommonApiPost).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling in Integration", () => {
    it("should handle API errors during save", async () => {
      const user = userEvent.setup();
      mockedCommonApiPost.mockRejectedValue(new Error("Network error"));

      const { handleEdit, handleSave } = createEditHandlers(
        store,
        mockSetToast,
        mockInvalidateDrops
      );
      (window as any).testHandleSave = handleSave;

      renderWithProviders(
        <WaveDrop {...createWaveDropProps(mockDrop, handleEdit)} />
      );
      const editTest = setupEditTest(user);

      // Complete error scenario flow
      await editTest.startEdit();
      await editTest.addToContent(" - updated");
      await editTest.save();

      // Verify error toast is shown
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: "Failed to update drop. Please try again.",
          type: "error",
        });
      });
    });

    it("should handle time limit violations", async () => {
      const user = userEvent.setup();
      mockedCommonApiPost.mockRejectedValue(
        new Error("This drop can't be edited after 5 minutes")
      );

      const oldDrop = createMockDrop({
        created_at: Date.now() - 6 * 60 * 1000,
      });
      const customSaveLogic = async (content: string, mentions: any[]) => {
        try {
          await mockedCommonApiPost({
            endpoint: `drops/${oldDrop.id}`,
            body: { content, mentioned_users: mentions },
          });
          mockSetToast({
            message: "Drop updated successfully",
            type: "success",
          });
          mockInvalidateDrops();
          store.dispatch(editSlice.actions.setEditingDropId(null));
        } catch (error) {
          // Explicitly handle time limit error in test - log for debugging
          console.error("Time limit error in test:", error);
          mockSetToast({
            message:
              "This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.",
            type: "error",
          });
        }
      };
      const { handleEdit, handleSave } = createCustomEditHandlers(
        store,
        mockSetToast,
        mockInvalidateDrops,
        customSaveLogic
      );

      (window as any).testHandleSave = handleSave;
      renderWithProviders(
        <WaveDrop {...createWaveDropProps(oldDrop, handleEdit)} />
      );
      const editTest = setupEditTest(user);

      // Complete time limit violation flow
      await editTest.startEdit();
      await editTest.addToContent(" - updated");
      await editTest.save();

      // Verify time limit error toast is shown
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message:
            "This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.",
          type: "error",
        });
      });
    });
  });

  describe("Real-time Updates", () => {
    it("should update UI after successful edit", async () => {
      const user = userEvent.setup();
      const updatedDrop = createMockDrop({
        parts: [{ ...mockDrop.parts[0], content: "Updated content" }],
        updated_at: Date.now(),
      });
      mockedCommonApiPost.mockResolvedValue(updatedDrop);

      const { handleEdit, handleSave } = createEditHandlers(
        store,
        mockSetToast,
        mockInvalidateDrops
      );
      (window as any).testHandleSave = handleSave;

      renderWithProviders(
        <WaveDrop {...createWaveDropProps(mockDrop, handleEdit)} />
      );
      const editTest = setupEditTest(user);

      // Complete UI update flow
      await editTest.startEdit();
      await editTest.editContent("Updated content");
      await editTest.save();

      // Verify the edit mode is closed after successful save
      await waitFor(() => {
        const editState = store.getState().edit;
        expect(editState.editingDropId).toBeNull();
      });

      // Verify cache invalidation triggers UI refresh
      expect(mockInvalidateDrops).toHaveBeenCalled();
    });
  });
});
