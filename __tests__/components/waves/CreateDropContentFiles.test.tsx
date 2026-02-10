import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CreateDropContentFiles } from '@/components/waves/CreateDropContentFiles';

jest.mock('@/components/waves/FilePreview', () => ({ __esModule: true, default: (props: any) => (
  <div data-testid="preview">
    {props.files.map((f: any) => (
      <button key={f.file.name} onClick={() => props.removeFile(f.file)}>{f.file.name}</button>
    ))}
  </div>
)}));

describe('CreateDropContentFiles', () => {
  const partFile = new File(['a'], 'part.png', { type: 'image/png' });
  const extraFile = new File(['b'], 'extra.png', { type: 'image/png' });

  it('passes all files to FilePreview and forwards partIndex', async () => {
    const remove = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateDropContentFiles
        parts={[{ media: [partFile] } as any]}
        files={[extraFile]}
        uploadingFiles={[]}
        removeFile={remove}
        disabled={false}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    await user.click(buttons[0]);
    expect(remove).toHaveBeenCalledWith(partFile, 0);
    await user.click(buttons[1]);
    expect(remove).toHaveBeenCalledWith(extraFile, undefined);
  });
});
