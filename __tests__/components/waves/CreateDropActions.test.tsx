import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateDropActions from '../../../components/waves/CreateDropActions';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
    button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../components/waves/StormButton', () => {
  return function MockStormButton({ isStormMode, canAddPart, submitting, breakIntoStorm }: any) {
    return (
      <button
        data-testid="storm-button"
        onClick={breakIntoStorm}
        disabled={submitting || !canAddPart}
      >
        {isStormMode ? 'Storm Mode' : 'Storm'}
      </button>
    );
  };
});

jest.mock('../../../components/waves/CreateDropGifPicker', () => {
  return function MockCreateDropGifPicker({ show, setShow, onSelect }: any) {
    return show ? (
      <div data-testid="gif-picker">
        <button onClick={() => onSelect('test-gif.gif')} data-testid="select-gif">
          Select GIF
        </button>
        <button onClick={() => setShow(false)} data-testid="close-gif">
          Close
        </button>
      </div>
    ) : null;
  };
});

jest.mock('../../../hooks/isMobileScreen', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

describe('CreateDropActions', () => {
  const defaultProps = {
    isStormMode: false,
    canAddPart: true,
    submitting: false,
    showOptions: false,
    isRequiredMetadataMissing: false,
    isRequiredMediaMissing: false,
    handleFileChange: jest.fn(),
    onAddMetadataClick: jest.fn(),
    breakIntoStorm: jest.fn(),
    setShowOptions: jest.fn(),
    onGifDrop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable for GIF picker
    process.env.TENOR_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.TENOR_API_KEY;
  });

  it('renders chevron button when options are hidden', () => {
    render(<CreateDropActions {...defaultProps} />);
    
    const chevronButton = screen.getByRole('button');
    expect(chevronButton).toBeInTheDocument();
    expect(chevronButton.querySelector('svg')).toBeInTheDocument();
  });

  it('shows options when chevron button is clicked', async () => {
    render(<CreateDropActions {...defaultProps} />);
    
    const chevronButton = screen.getByRole('button');
    await userEvent.click(chevronButton);
    
    expect(defaultProps.setShowOptions).toHaveBeenCalledWith(true);
  });

  it('renders all action buttons when options are shown', () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    expect(screen.getByLabelText('Upload a file')).toBeInTheDocument();
    expect(screen.getByLabelText('Add GIF')).toBeInTheDocument();
    expect(screen.getByTestId('storm-button')).toBeInTheDocument();
    // Should have multiple buttons when options are shown
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('calls onAddMetadataClick when metadata button is clicked', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    // The metadata button is the first button (without aria-label)
    const buttons = screen.getAllByRole('button');
    const metadataButton = buttons.find(button => !button.getAttribute('aria-label') && !button.getAttribute('data-testid'));
    await userEvent.click(metadataButton!);
    
    expect(defaultProps.onAddMetadataClick).toHaveBeenCalled();
  });

  it('handles file upload', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const fileInput = screen.getByLabelText('Upload a file').querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await userEvent.upload(fileInput!, file);
    
    expect(defaultProps.handleFileChange).toHaveBeenCalledWith([file]);
  });

  it('shows GIF picker when GIF button is clicked', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const gifButton = screen.getByLabelText('Add GIF');
    await userEvent.click(gifButton);
    
    expect(screen.getByTestId('gif-picker')).toBeInTheDocument();
  });

  it('calls onGifDrop when GIF is selected', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const gifButton = screen.getByLabelText('Add GIF');
    await userEvent.click(gifButton);
    
    const selectGifButton = screen.getByTestId('select-gif');
    await userEvent.click(selectGifButton);
    
    expect(defaultProps.onGifDrop).toHaveBeenCalledWith('test-gif.gif');
  });

  it('hides GIF picker when closed', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const gifButton = screen.getByLabelText('Add GIF');
    await userEvent.click(gifButton);
    
    expect(screen.getByTestId('gif-picker')).toBeInTheDocument();
    
    const closeButton = screen.getByTestId('close-gif');
    await userEvent.click(closeButton);
    
    expect(screen.queryByTestId('gif-picker')).not.toBeInTheDocument();
  });

  it('closes GIF picker on Escape key', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const gifButton = screen.getByLabelText('Add GIF');
    await userEvent.click(gifButton);
    
    expect(screen.getByTestId('gif-picker')).toBeInTheDocument();
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByTestId('gif-picker')).not.toBeInTheDocument();
    });
  });

  it('does not show GIF button when API key is not available', () => {
    delete process.env.TENOR_API_KEY;
    
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    expect(screen.queryByLabelText('Add GIF')).not.toBeInTheDocument();
  });

  it('highlights metadata button when metadata is missing', () => {
    render(
      <CreateDropActions 
        {...defaultProps} 
        showOptions={true}
        isRequiredMetadataMissing={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const metadataButton = buttons.find(button => !button.getAttribute('aria-label') && !button.getAttribute('data-testid'));
    expect(metadataButton).toHaveClass('tw-text-[#FEDF89]');
  });

  it('highlights upload button when media is missing', () => {
    render(
      <CreateDropActions 
        {...defaultProps} 
        showOptions={true}
        isRequiredMediaMissing={true}
      />
    );
    
    const uploadLabel = screen.getByLabelText('Upload a file');
    expect(uploadLabel).toHaveClass('tw-text-[#FEDF89]');
  });

  it('highlights chevron button when any required content is missing', () => {
    render(
      <CreateDropActions 
        {...defaultProps} 
        isRequiredMetadataMissing={true}
        isRequiredMediaMissing={true}
      />
    );
    
    const chevronButton = screen.getByRole('button');
    expect(chevronButton).toHaveClass('tw-text-[#FEDF89]');
  });

  it('accepts multiple file types', () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const fileInput = screen.getByLabelText('Upload a file').querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', 'image/*,video/*,audio/*');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('passes correct props to StormButton', () => {
    render(
      <CreateDropActions 
        {...defaultProps} 
        showOptions={true}
        isStormMode={true}
        canAddPart={false}
        submitting={true}
      />
    );
    
    const stormButton = screen.getByTestId('storm-button');
    expect(stormButton).toHaveTextContent('Storm Mode');
    expect(stormButton).toBeDisabled();
  });

  it('calls breakIntoStorm when storm button is clicked', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const stormButton = screen.getByTestId('storm-button');
    await userEvent.click(stormButton);
    
    expect(defaultProps.breakIntoStorm).toHaveBeenCalled();
  });

  it('handles multiple file selection', async () => {
    render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const fileInput = screen.getByLabelText('Upload a file').querySelector('input[type="file"]');
    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.png', { type: 'image/png' }),
    ];
    
    await userEvent.upload(fileInput!, files);
    
    expect(defaultProps.handleFileChange).toHaveBeenCalledWith(files);
  });

  it('cleans up event listeners on unmount', async () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<CreateDropActions {...defaultProps} showOptions={true} />);
    
    const gifButton = screen.getByLabelText('Add GIF');
    await userEvent.click(gifButton);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });
});