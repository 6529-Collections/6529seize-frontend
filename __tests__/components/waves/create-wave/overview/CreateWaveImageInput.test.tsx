import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../../../../../components/auth/Auth';
import CreateWaveImageInput from '../../../../../components/waves/create-wave/overview/CreateWaveImageInput';
import { createMockAuthContext } from '../../../../utils/testContexts';

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-object-url'),
});

describe('CreateWaveImageInput', () => {
  const mockSetFile = jest.fn();
  const mockSetToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (imageToShow: File | null = null, authOverrides = {}) => {
    const authContext = createMockAuthContext({
      setToast: mockSetToast,
      ...authOverrides,
    });

    return render(
      <AuthContext.Provider value={authContext}>
        <CreateWaveImageInput
          imageToShow={imageToShow}
          setFile={mockSetFile}
        />
      </AuthContext.Provider>
    );
  };

  const createMockFile = (
    name: string,
    type: string,
    size: number = 1000
  ): File => {
    const file = new File(['content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  it('renders upload area without image', () => {
    renderComponent();
    
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('JPEG, JPG, PNG, GIF, WEBP')).toBeInTheDocument();
  });

  it('renders image preview when file provided', () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    renderComponent(mockFile);
    
    const img = screen.getByAltText('Profile image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'mocked-object-url');
  });

  it('shows delete button when image is present', () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    renderComponent(mockFile);
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('hides delete button when no image', () => {
    renderComponent();
    
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('removes image when delete button clicked', () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    renderComponent(mockFile);
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockSetFile).toHaveBeenCalledWith(null);
  });

  it('accepts valid image file upload', () => {
    renderComponent();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile('test.jpg', 'image/jpeg');
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    expect(mockSetFile).toHaveBeenCalledWith(validFile);
    expect(mockSetToast).not.toHaveBeenCalled();
  });

  it('rejects invalid file type', () => {
    renderComponent();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile('test.txt', 'text/plain');
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    expect(mockSetFile).not.toHaveBeenCalled();
    expect(mockSetToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Invalid file type',
    });
  });

  it('rejects file that is too large', () => {
    renderComponent();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = createMockFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024); // 11MB
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    expect(mockSetFile).not.toHaveBeenCalled();
    expect(mockSetToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'File size must be less than 10MB',
    });
  });

  it('handles drag and drop with valid file', () => {
    renderComponent();
    
    const dropArea = document.querySelector('label') as HTMLElement;
    const validFile = createMockFile('test.png', 'image/png');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [validFile] },
    });
    
    fireEvent(dropArea, dropEvent);
    
    expect(mockSetFile).toHaveBeenCalledWith(validFile);
  });

  it('updates drag state on drag events', () => {
    renderComponent();
    
    const dropArea = document.querySelector('label') as HTMLElement;
    
    // Initial state - should not have dragging styles
    expect(dropArea).toHaveClass('tw-bg-iron-900', 'tw-border-iron-700');
    
    // Drag enter
    fireEvent.dragEnter(dropArea);
    expect(dropArea).toHaveClass('tw-border-iron-600', 'tw-bg-iron-800');
    
    // Drag leave
    fireEvent.dragLeave(dropArea);
    expect(dropArea).toHaveClass('tw-bg-iron-900', 'tw-border-iron-700');
  });

  it('prevents default on drag events', () => {
    renderComponent();
    
    const dropArea = document.querySelector('label') as HTMLElement;
    
    const dragEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(dragEvent, 'preventDefault');
    const stopPropagationSpy = jest.spyOn(dragEvent, 'stopPropagation');
    
    fireEvent(dropArea, dragEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('handles drop event with no files', () => {
    renderComponent();
    
    const dropArea = document.querySelector('label') as HTMLElement;
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [] },
    });
    
    fireEvent(dropArea, dropEvent);
    
    expect(mockSetFile).not.toHaveBeenCalled();
  });

  it('handles various supported image formats', () => {
    const supportedFormats = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    supportedFormats.forEach((format) => {
      mockSetFile.mockClear();
      mockSetToast.mockClear();
      
      renderComponent();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile(`test.${format.split('/')[1]}`, format);
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      expect(mockSetFile).toHaveBeenCalledWith(validFile);
      expect(mockSetToast).not.toHaveBeenCalled();
    });
  });

  it('has correct file input attributes', () => {
    renderComponent();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    expect(fileInput).toHaveAttribute('accept', '.jpeg, .jpg, .png, .gif, .webp');
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveClass('tw-hidden');
  });

  it('has correct accessibility attributes', () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    renderComponent(mockFile);
    
    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveAttribute('aria-label', 'Remove file');
  });
});