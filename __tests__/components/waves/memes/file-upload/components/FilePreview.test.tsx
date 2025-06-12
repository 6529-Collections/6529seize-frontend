import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilePreview from '../../../../../../components/waves/memes/file-upload/components/FilePreview';

jest.mock('../../../../../../components/waves/memes/file-upload/components/VideoFallbackPreview', () => () => <div data-testid="fallback" />);

const file = new File(['a'], 'a.mp4', { type: 'video/mp4' });

beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:url', writable: true });
});

test('shows image preview and remove button', async () => {
  const onRemove = jest.fn();
  const user = userEvent.setup();
  render(<FilePreview url="data:image/png;base64,abc" file={new File(['a'],'a.png',{type:'image/png'})} onRemove={onRemove} isCheckingCompatibility={false} />);
  expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,abc');
  await user.click(screen.getByTestId('artwork-replace-button'));
  expect(onRemove).toHaveBeenCalled();
});

test('shows fallback for incompatible video', () => {
  render(<FilePreview url="data:video/mp4;base64,foo" file={file} onRemove={jest.fn()} videoCompatibility={{ canPlay: false, errorMessage: 'err' }} isCheckingCompatibility={false} />);
  expect(screen.getByTestId('fallback')).toBeInTheDocument();
});

test('shows compatibility indicator when checking', () => {
  render(<FilePreview url="data:video/mp4;base64,x" file={file} onRemove={jest.fn()} isCheckingCompatibility={true} />);
  expect(screen.getByText('Checking video compatibility...')).toBeInTheDocument();
});
