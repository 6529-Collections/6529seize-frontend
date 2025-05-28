import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useArtworkSubmissionMutation } from '../../../../../../components/waves/memes/submission/hooks/useArtworkSubmissionMutation';

jest.mock('../../../../../../hooks/drops/useDropSignature', () => ({
  useDropSignature: () => ({ signDrop: jest.fn(() => Promise.resolve({ success: true, signature: 'sig' })), isLoading: false }),
}));

jest.mock('../../../../../../services/api/common-api', () => ({
  commonApiPost: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../../../../../../components/auth/Auth', () => ({
  useAuth: () => ({ setToast: jest.fn(), requestAuth: jest.fn(() => Promise.resolve({ success: true })) }),
}));

jest.mock('../../../../../../components/waves/create-wave/services/multiPartUpload', () => ({
  multiPartUpload: jest.fn(() => Promise.resolve({ url: 'media', mime_type: 'image/png' })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const file = new File(['data'], 'test.png', { type: 'image/png' });

it('validates required fields', async () => {
  const { result } = renderHook(() => useArtworkSubmissionMutation(), { wrapper: createWrapper() });
  const res = await result.current.submitArtwork({ imageFile: file, traits: { title: '' } as any, waveId: '1', termsOfService: null });
  expect(res).toBeNull();
});

it('submits artwork successfully', async () => {
  const { result } = renderHook(() => useArtworkSubmissionMutation(), { wrapper: createWrapper() });
  const res = await result.current.submitArtwork({ imageFile: file, traits: { title: 't', description: 'd' } as any, waveId: '1', termsOfService: null });
  await waitFor(() => expect(require('../../../../../../components/waves/create-wave/services/multiPartUpload').multiPartUpload).toHaveBeenCalled());
  expect(require('../../../../../../services/api/common-api').commonApiPost).toHaveBeenCalled();
  expect(res).not.toBeNull();
});
