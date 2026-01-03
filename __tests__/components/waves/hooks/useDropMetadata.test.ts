import { renderHook } from '@testing-library/react';
import { useDropMetadata } from '@/components/waves/hooks/useDropMetadata';
import { ApiWaveMetadataType } from '@/generated/models/ApiWaveMetadataType';

const required = [{ name: 'foo', type: ApiWaveMetadataType.String }];

test('initializes metadata in drop mode', () => {
  const { result } = renderHook(() => useDropMetadata({ isDropMode: true, requiredMetadata: required }));
  expect(result.current.metadata[0]).toMatchObject({ key: 'foo', required: true });
});

test('removes unset required metadata when leaving drop mode', () => {
  const { result, rerender } = renderHook((props: any) => useDropMetadata(props), {
    initialProps: { isDropMode: true, requiredMetadata: required },
  });
  expect(result.current.metadata.length).toBe(1);
  rerender({ isDropMode: false, requiredMetadata: required });
  expect(result.current.metadata.length).toBe(0);
});

test('adds missing required metadata when entering drop mode', () => {
  const { result, rerender } = renderHook((props: any) => useDropMetadata(props), {
    initialProps: { isDropMode: false, requiredMetadata: required },
  });
  expect(result.current.metadata.length).toBe(0);
  rerender({ isDropMode: true, requiredMetadata: required });
  expect(result.current.metadata[0]?.key).toBe('foo');
});
