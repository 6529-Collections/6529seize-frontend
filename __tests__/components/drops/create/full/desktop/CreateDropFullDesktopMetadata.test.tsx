import { fireEvent, render, screen } from '@testing-library/react';
import CreateDropFullDesktopMetadata from '@/components/drops/create/full/desktop/CreateDropFullDesktopMetadata';
import { DropMetadata } from '@/entities/IDrop';

describe('CreateDropFullDesktopMetadata', () => {
  const metadata: DropMetadata[] = [
    { data_key: 'Category', data_value: 'Art' },
  ];
  const onMetadataEdit = jest.fn();
  const onMetadataRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders existing metadata items', () => {
    render(
      <CreateDropFullDesktopMetadata
        metadata={metadata}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
      />
    );
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/art/i)).toBeInTheDocument();
  });

  it('calls onMetadataEdit when form is submitted and resets fields', () => {
    render(
      <CreateDropFullDesktopMetadata
        metadata={[]}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
      />
    );

    const keyInput = screen.getByPlaceholderText('Category') as HTMLInputElement;
    const valueInput = screen.getByPlaceholderText('Value') as HTMLInputElement;
    fireEvent.change(keyInput, { target: { value: 'Type' } });
    fireEvent.change(valueInput, { target: { value: 'Value' } });
    fireEvent.click(screen.getByRole('button', { name: /add metadata/i }));

    expect(onMetadataEdit).toHaveBeenCalledWith({ data_key: 'Type', data_value: 'Value' });
    expect(keyInput.value).toBe('');
    expect(valueInput.value).toBe('');
    expect(keyInput).toHaveFocus();
  });
});
