import { render, screen, fireEvent } from '@testing-library/react';
import CreateDropActionsRow from '@/components/drops/create/utils/CreateDropActionsRow';
import { AuthContext } from '@/components/auth/Auth';
import { MAX_DROP_UPLOAD_FILES } from '@/helpers/Helpers';

function renderComponent(props: any, ctx?: any) {
  const value = { setToast: jest.fn(), ...(ctx || {}) } as any;
  return {
    ...render(
      <AuthContext.Provider value={value}>
        <CreateDropActionsRow {...props} />
      </AuthContext.Provider>
    ),
    toast: value.setToast,
  };
}

describe('CreateDropActionsRow', () => {
  it('shows toast when uploading too many files', () => {
    const setFiles = jest.fn();
    const files = Array.from({ length: MAX_DROP_UPLOAD_FILES + 1 }, (_, i) => new File([''], `f${i}.png`, { type: 'image/png' }));
    const { toast } = renderComponent({ canAddPart: false, isStormMode: false, setFiles, breakIntoStorm: jest.fn() });
    const button = screen.getByRole('button', { name: /select audio file/i });
    const input = button.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });
    expect(toast).toHaveBeenCalledWith({ message: 'You can only upload up to 4 files at a time', type: 'error' });
    expect(setFiles).not.toHaveBeenCalled();
  });

  it('passes files to callback when under limit', () => {
    const setFiles = jest.fn();
    const files = [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.png', { type: 'image/png' })];
    const { toast } = renderComponent({ canAddPart: false, isStormMode: false, setFiles, breakIntoStorm: jest.fn() });
    const button = screen.getByRole('button', { name: /select audio file/i });
    const input = button.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });
    expect(setFiles).toHaveBeenCalledWith(files);
    expect(toast).not.toHaveBeenCalled();
  });

  it('renders break into storm button when allowed and handles click', () => {
    const handler = jest.fn();
    renderComponent({ canAddPart: true, isStormMode: false, setFiles: jest.fn(), breakIntoStorm: handler });
    const button = screen.getByRole('button', { name: /break into storm/i });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalled();
  });

  it('shows continue storm text when in storm mode', () => {
    renderComponent({ canAddPart: true, isStormMode: true, setFiles: jest.fn(), breakIntoStorm: jest.fn() });
    expect(screen.getByText(/continue storm/i)).toBeInTheDocument();
  });

  it('hides storm button when cannot add part', () => {
    renderComponent({ canAddPart: false, isStormMode: false, setFiles: jest.fn(), breakIntoStorm: jest.fn() });
    expect(screen.queryByRole('button', { name: /break into storm/i })).not.toBeInTheDocument();
  });
});
