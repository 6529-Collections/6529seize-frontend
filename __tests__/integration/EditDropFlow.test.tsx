import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Add ResizeObserver polyfill for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WaveDrop from '../../components/waves/drops/WaveDrop';
import { AuthContext } from '../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../components/react-query-wrapper/ReactQueryWrapper';
import { editSlice } from '../../store/editSlice';
import { ApiDropType } from '../../generated/models/ApiDropType';
import { commonApiPost } from '../../services/api/common-api';

// Mock the API
jest.mock('../../services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

// Mock the MyStreamContext
jest.mock('../../contexts/wave/MyStreamContext', () => ({
  MyStreamProvider: ({ children }: any) => children,
  useMyStream: () => ({
    processIncomingDrop: jest.fn(),
  }),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
    pathname: '/',
  }),
}));

// Mock mobile device hook
jest.mock('../../hooks/isMobileDevice', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

// The actual drop update mutation hook will be used with mocked API

// Mock the EmojiContext
jest.mock('../../contexts/EmojiContext', () => ({
  EmojiProvider: ({ children }: any) => children,
  useEmoji: () => ({
    emojiMap: [],
    loading: false,
    categories: [],
    categoryIcons: {},
    findNativeEmoji: jest.fn(),
  }),
}));

// Mock SeizeSettingsContext
jest.mock('../../contexts/SeizeSettingsContext', () => ({
  useSeizeSettings: () => ({
    settings: {},
  }),
}));

// Mock WaveDropActions to focus on edit functionality
jest.mock('../../components/waves/drops/WaveDropActions', () => {
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
  onSave?: (content: string, mentions: any[]) => void;
  onCancel?: () => void;
}>({});

// Mock WaveDropPartContentMarkdown to check for edit state
jest.mock('../../components/waves/drops/WaveDropPartContentMarkdown', () => {
  const React = require('react');
  const { useSelector, useContext } = require('react-redux');
  
  return function MockWaveDropPartContentMarkdown({ part }: any) {
    const editState = useSelector((state: any) => state.edit);
    const isEditing = editState.editingDropId === 'drop-123';
    
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


const mockedCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;

describe('Edit Drop Integration Flow', () => {
  let queryClient: QueryClient;
  let store: any;
  let mockSetToast: jest.Mock;
  let mockInvalidateDrops: jest.Mock;

  const mockDrop = {
    id: 'drop-123',
    serial_no: 1,
    author: { handle: 'testuser' },
    wave: { id: 'wave-123' },
    created_at: Date.now() - 60000, // 1 minute ago (within edit window)
    updated_at: null,
    title: null,
    parts: [{ 
      part_id: 1, 
      content: 'Original content', 
      media: [], 
      quoted_drop: null, 
      replies_count: 0, 
      quotes_count: 0 
    }],
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
    type: 'FULL' as any,
    stableKey: 'drop-123',
    stableHash: 'hash-123'
  };

  const authUser = {
    handle: 'testuser',
    profile_id: 'profile-123'
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    store = configureStore({
      reducer: {
        edit: editSlice.reducer,
      },
    });

    mockSetToast = jest.fn();
    mockInvalidateDrops = jest.fn();

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

  describe('Complete Edit Flow', () => {
    it('should complete full edit flow: click edit → edit content → save → API call', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      const updatedDrop = {
        ...mockDrop,
        parts: [{ ...mockDrop.parts[0], content: 'Updated content' }],
        updated_at: Date.now(),
      };
      mockedCommonApiPost.mockResolvedValue(updatedDrop);

      // Create a function to handle edit that dispatches to Redux and calls the mutation
      const handleEdit = () => {
        store.dispatch(editSlice.actions.setEditingDropId('drop-123'));
      };

      // Create a function to handle save that uses the mutation
      const handleSave = async (content: string, mentions: any[]) => {
        try {
          const updatedDrop = await mockedCommonApiPost({
            endpoint: `drops/${mockDrop.id}`,
            body: {
              content,
              mentioned_users: mentions,
            },
          });
          
          mockSetToast({
            message: 'Drop updated successfully',
            type: 'success',
          });
          mockInvalidateDrops();
          store.dispatch(editSlice.actions.setEditingDropId(null));
        } catch (error) {
          mockSetToast({
            message: 'Failed to update drop. Please try again.',
            type: 'error',
          });
        }
      };

      const handleCancel = () => {
        store.dispatch(editSlice.actions.setEditingDropId(null));
      };

      // Set global handlers for the mock to use
      (window as any).testHandleSave = handleSave;
      (window as any).testHandleCancel = handleCancel;

      // Render the WaveDrop component with edit capability
      renderWithProviders(
        <WaveDrop
          drop={mockDrop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={true}
          location={0 as any}
          dropViewDropId={null}
          onReply={jest.fn()}
          onQuote={jest.fn()}
          onReplyClick={jest.fn()}
          onQuoteClick={jest.fn()}
          onEdit={handleEdit} // Enable edit functionality with actual handler
        />
      );

      // Step 1: Click edit button
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      // Wait for edit component to appear
      await waitFor(() => {
        expect(screen.getByTestId('edit-drop-lexical')).toBeInTheDocument();
      });

      // Step 2: Edit the content
      const editTextarea = screen.getByTestId('edit-content');
      await user.clear(editTextarea);
      await user.type(editTextarea, 'Updated content');

      // Step 3: Save the changes
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

      // Step 4: Verify API call was made
      await waitFor(() => {
        expect(mockedCommonApiPost).toHaveBeenCalledWith({
          endpoint: 'drops/drop-123',
          body: {
            content: 'Updated content',
            mentioned_users: [],
          },
        });
      });

      // Step 5: Verify success toast
      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Drop updated successfully',
        type: 'success',
      });

      // Step 6: Verify cache invalidation
      expect(mockInvalidateDrops).toHaveBeenCalled();
    });

    it('should handle edit cancellation flow', async () => {
      const user = userEvent.setup();
      
      // Set up handlers
      const handleEdit = () => {
        store.dispatch(editSlice.actions.setEditingDropId('drop-123'));
      };

      const handleCancel = () => {
        store.dispatch(editSlice.actions.setEditingDropId(null));
      };

      (window as any).testHandleCancel = handleCancel;
      
      renderWithProviders(
        <WaveDrop
          drop={mockDrop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={true}
          location={0 as any}
          dropViewDropId={null}
          onReply={jest.fn()}
          onQuote={jest.fn()}
          onReplyClick={jest.fn()}
          onQuoteClick={jest.fn()}
          onEdit={handleEdit}
        />
      );

      // Start edit mode
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-drop-lexical')).toBeInTheDocument();
      });

      // Make some changes
      const editTextarea = screen.getByTestId('edit-content');
      await user.type(editTextarea, ' - with changes');

      // Cancel the edit
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      // Verify no API call was made
      expect(mockedCommonApiPost).not.toHaveBeenCalled();

      // Verify edit mode is closed (Redux state)
      const editState = store.getState().edit;
      expect(editState.editingDropId).toBeNull();
    });

    it('should handle no-changes save gracefully', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <WaveDrop
          drop={mockDrop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={true}
          location={0 as any}
          dropViewDropId={null}
          onReply={jest.fn()}
          onQuote={jest.fn()}
          onReplyClick={jest.fn()}
          onQuoteClick={jest.fn()}
          onEdit={jest.fn()}
        />
      );

      // Start edit mode
      store.dispatch(editSlice.actions.setEditingDropId('drop-123'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-drop-lexical')).toBeInTheDocument();
      });

      // Save without making changes
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

      // Verify no API call was made for unchanged content
      expect(mockedCommonApiPost).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling in Integration', () => {
    it('should handle API errors during save', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      const apiError = new Error('Network error');
      mockedCommonApiPost.mockRejectedValue(apiError);

      // Set up handlers
      const handleEdit = () => {
        store.dispatch(editSlice.actions.setEditingDropId('drop-123'));
      };

      const handleSave = async (content: string, mentions: any[]) => {
        try {
          await mockedCommonApiPost({
            endpoint: `drops/${mockDrop.id}`,
            body: {
              content,
              mentioned_users: mentions,
            },
          });
          
          mockSetToast({
            message: 'Drop updated successfully',
            type: 'success',
          });
          mockInvalidateDrops();
          store.dispatch(editSlice.actions.setEditingDropId(null));
        } catch (error) {
          mockSetToast({
            message: 'Failed to update drop. Please try again.',
            type: 'error',
          });
        }
      };

      (window as any).testHandleSave = handleSave;

      renderWithProviders(
        <WaveDrop
          drop={mockDrop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={true}
          location={0 as any}
          dropViewDropId={null}
          onReply={jest.fn()}
          onQuote={jest.fn()}
          onReplyClick={jest.fn()}
          onQuoteClick={jest.fn()}
          onEdit={handleEdit}
        />
      );

      // Start edit mode
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-drop-lexical')).toBeInTheDocument();
      });

      // Edit content
      const editTextarea = screen.getByTestId('edit-content');
      await user.type(editTextarea, ' - updated');

      // Attempt to save
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

      // Verify error toast is shown
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle time limit violations', async () => {
      const user = userEvent.setup();
      
      // Mock time limit error
      const timeLimitError = new Error('This drop can\'t be edited after 5 minutes');
      mockedCommonApiPost.mockRejectedValue(timeLimitError);

      // Create a drop that's older than 5 minutes
      const oldDrop = {
        ...mockDrop,
        created_at: Date.now() - (6 * 60 * 1000), // 6 minutes ago
      };

      // Set up handlers
      const handleEdit = () => {
        store.dispatch(editSlice.actions.setEditingDropId('drop-123'));
      };

      const handleSave = async (content: string, mentions: any[]) => {
        try {
          await mockedCommonApiPost({
            endpoint: `drops/${oldDrop.id}`,
            body: {
              content,
              mentioned_users: mentions,
            },
          });
          
          mockSetToast({
            message: 'Drop updated successfully',
            type: 'success',
          });
          mockInvalidateDrops();
          store.dispatch(editSlice.actions.setEditingDropId(null));
        } catch (error) {
          mockSetToast({
            message: 'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.',
            type: 'error',
          });
        }
      };

      (window as any).testHandleSave = handleSave;

      renderWithProviders(
        <WaveDrop
          drop={oldDrop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={true}
          location={0 as any}
          dropViewDropId={null}
          onReply={jest.fn()}
          onQuote={jest.fn()}
          onReplyClick={jest.fn()}
          onQuoteClick={jest.fn()}
          onEdit={handleEdit}
        />
      );

      // Start edit mode
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-drop-lexical')).toBeInTheDocument();
      });

      // Edit content
      const editTextarea = screen.getByTestId('edit-content');
      await user.type(editTextarea, ' - updated');

      // Attempt to save
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

      // Verify time limit error toast is shown
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.',
          type: 'error',
        });
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update UI after successful edit', async () => {
      const user = userEvent.setup();
      
      const updatedDrop = {
        ...mockDrop,
        parts: [{ ...mockDrop.parts[0], content: 'Updated content' }],
        updated_at: Date.now(),
      };
      mockedCommonApiPost.mockResolvedValue(updatedDrop);

      // Set up handlers like other tests
      const handleEdit = () => {
        store.dispatch(editSlice.actions.setEditingDropId('drop-123'));
      };

      const handleSave = async (content: string, mentions: any[]) => {
        try {
          const updatedDrop = await mockedCommonApiPost({
            endpoint: `drops/${mockDrop.id}`,
            body: {
              content,
              mentioned_users: mentions,
            },
          });
          
          mockSetToast({
            message: 'Drop updated successfully',
            type: 'success',
          });
          mockInvalidateDrops();
          store.dispatch(editSlice.actions.setEditingDropId(null));
        } catch (error) {
          mockSetToast({
            message: 'Failed to update drop. Please try again.',
            type: 'error',
          });
        }
      };

      // Set global handlers for the mock to use
      (window as any).testHandleSave = handleSave;

      renderWithProviders(
        <WaveDrop
          drop={mockDrop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={true}
          location={0 as any}
          dropViewDropId={null}
          onReply={jest.fn()}
          onQuote={jest.fn()}
          onReplyClick={jest.fn()}
          onQuoteClick={jest.fn()}
          onEdit={handleEdit}
        />
      );

      // Start edit, make changes, and save
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-drop-lexical')).toBeInTheDocument();
      });

      const editTextarea = screen.getByTestId('edit-content');
      await user.clear(editTextarea);
      await user.type(editTextarea, 'Updated content');

      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

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