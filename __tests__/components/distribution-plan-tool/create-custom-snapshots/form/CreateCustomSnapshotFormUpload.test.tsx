import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCustomSnapshotFormUpload from '@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormUpload';

function setup(csv: string) {
  const setFileName = jest.fn();
  const setTokens = jest.fn();
  const file = new File([csv], 'wallets.csv', { type: 'text/csv' });
  class MockFileReader {
    result: string | ArrayBuffer | null = null;
    onload: null | (() => void) = null;
    readAsText(_file: File) {
      this.result = csv;
      if (this.onload) this.onload();
    }
  }
  // @ts-ignore
  global.FileReader = MockFileReader;
  render(
    <CreateCustomSnapshotFormUpload fileName={null} setFileName={setFileName} setTokens={setTokens} />
  );
  const input = screen.getByLabelText('Upload a CSV');
  fireEvent.change(input, { target: { files: [file] } });
  return { setFileName, setTokens };
}

describe('CreateCustomSnapshotFormUpload', () => {
  it('parses CSV with header and sets tokens and filename', async () => {
    const csv = 'owner\n0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const { setFileName, setTokens } = setup(csv);
    await waitFor(() => {
      expect(setFileName).toHaveBeenCalledWith('wallets.csv');
      expect(setTokens).toHaveBeenCalledWith([
        { owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { owner: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
      ]);
    });
  });

  it('ignores invalid addresses', async () => {
    const csv = 'owner\n0xInvalid\n0xcccccccccccccccccccccccccccccccccccccccc';
    const { setTokens } = setup(csv);
    await waitFor(() => {
      expect(setTokens).toHaveBeenCalledWith([
        { owner: '0xcccccccccccccccccccccccccccccccccccccccc' },
      ]);
    });
  });
});
