import { fireEvent, render, screen } from '@testing-library/react';
import CreateDropFullMobileMetadata from '../../../../../../components/drops/create/full/mobile/CreateDropFullMobileMetadata';
import { DropMetadata } from '../../../../../../entities/IDrop';

describe('CreateDropFullMobileMetadata', () => {
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
      <CreateDropFullMobileMetadata
        metadata={metadata}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
      />
    );
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/art/i)).toBeInTheDocument();
  });

  it('calls onMetadataEdit when form is submitted', () => {
    render(
      <CreateDropFullMobileMetadata
        metadata={[]}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Category'), { target: { value: 'Type' } });
    fireEvent.change(screen.getByPlaceholderText('Value'), { target: { value: 'Value' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onMetadataEdit).toHaveBeenCalledWith({ data_key: 'Type', data_value: 'Value' });
    expect((screen.getByPlaceholderText('Category') as HTMLInputElement).value).toBe('');
    expect((screen.getByPlaceholderText('Value') as HTMLInputElement).value).toBe('');
  });
});
