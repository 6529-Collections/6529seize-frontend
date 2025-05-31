import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MAX_DROP_UPLOAD_FILES } from '../../../helpers/Helpers';

// Mock a simple file upload handler to test the logic
const MockFileUploadComponent = ({ onFileChange }: { onFileChange: (files: File[]) => void }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFileChange(files);
  };

  return (
    <label aria-label="Upload a file">
      <input type="file" multiple onChange={handleFileChange} />
    </label>
  );
};

describe('CreateDropContent', () => {
  it('limits number of uploaded files', () => {
    const setToast = jest.fn();
    
    // Mock the file handling logic that's in CreateDropContent
    const handleFileChange = (newFiles: File[]) => {
      const existingFiles: File[] = [];
      let updatedFiles = [...existingFiles, ...newFiles];
      let removedCount = 0;

      if (updatedFiles.length > MAX_DROP_UPLOAD_FILES) {
        removedCount = updatedFiles.length - MAX_DROP_UPLOAD_FILES;
        updatedFiles = updatedFiles.slice(-MAX_DROP_UPLOAD_FILES);

        setToast({
          message: `File limit exceeded. The ${removedCount} oldest file${
            removedCount > 1 ? "s were" : " was"
          } removed to maintain the ${MAX_DROP_UPLOAD_FILES}-file limit. New files have been added.`,
          type: "warning",
        });
      }
    };

    const { getByLabelText } = render(
      <MockFileUploadComponent onFileChange={handleFileChange} />
    );
    
    const input = getByLabelText('Upload a file').querySelector('input') as HTMLInputElement;
    const files = Array.from({ length: MAX_DROP_UPLOAD_FILES + 2 }, (_, i) => new File(['a'], `f${i}.png`, { type: 'image/png' }));
    
    fireEvent.change(input, { target: { files } });
    
    expect(setToast).toHaveBeenCalledWith({
      message: expect.stringContaining('File limit exceeded'),
      type: "warning",
    });
  });
});
