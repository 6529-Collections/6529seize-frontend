import { fireEvent, render, screen } from '@testing-library/react';
import React, { createRef } from 'react';
import CreateDropFullDesktop, { CreateDropFullDesktopHandles } from '../../../../../../components/drops/create/full/desktop/CreateDropFullDesktop';
import { CreateDropType, CreateDropViewType } from '../../../../../../components/drops/create/types';

jest.mock('../../../../../../components/drops/create/utils/CreateDropContent', () =>
  React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({ clearEditorState: jest.fn() }));
    return (
      <button data-testid="content" onClick={() => props.onViewClick?.()} />
    );
  })
);

jest.mock('../../../../../../components/drops/create/utils/file/CreateDropSelectedFileIcon', () => ({ file }: any) => <span data-testid="icon">{file.name}</span>);
jest.mock('../../../../../../components/drops/create/utils/file/CreateDropSelectedFilePreview', () => ({ file }: any) => <div data-testid="preview">{file.name}</div>);
jest.mock('../../../../../../components/drops/create/utils/CreateDropDesktopFooter', () => (props: any) => (
  <button onClick={props.onDrop}>{props.type === 'DROP' ? 'Drop' : 'Quote'}</button>
));

function renderComponent(props: Partial<React.ComponentProps<typeof CreateDropFullDesktop>> = {}) {
  const ref = createRef<CreateDropFullDesktopHandles>();
  const file = new File(['a'], 'file.png', { type: 'image/png' });
  render(
    <CreateDropFullDesktop
      ref={ref}
      profile={{} as any}
      title={null}
      metadata={[]}
      editorState={null}
      files={props.files ?? []}
      canSubmit={props.canSubmit ?? false}
      canAddPart={false}
      loading={props.loading ?? false}
      showSubmit={props.showSubmit ?? false}
      type={props.type ?? CreateDropType.DROP}
      drop={null}
      showDropError={false}
      missingMedia={[]}
      missingMetadata={[]}
      waveId={null}
      onTitle={props.onTitle ?? jest.fn()}
      onMetadataEdit={jest.fn()}
      onMetadataRemove={jest.fn()}
      onViewChange={props.onViewChange ?? jest.fn()}
      onEditorState={jest.fn()}
      onMentionedUser={jest.fn()}
      onReferencedNft={jest.fn()}
      onFileRemove={props.onFileRemove ?? jest.fn()}
      setFiles={jest.fn()}
      onDrop={props.onDrop ?? jest.fn()}
      onDropPart={jest.fn()}
    >
      child
    </CreateDropFullDesktop>
  );
  return { ref };
}

describe('CreateDropFullDesktop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows title input after clicking add title and calls onTitle', () => {
    const onTitle = jest.fn();
    renderComponent({ onTitle });
    fireEvent.click(screen.getByRole('button', { name: /add title/i }));
    const input = screen.getByPlaceholderText('Drop title');
    fireEvent.change(input, { target: { value: 'My title' } });
    expect(onTitle).toHaveBeenCalledWith('My title');
  });

  it('calls onFileRemove when remove button clicked', () => {
    const onFileRemove = jest.fn();
    const file = new File(['a'], 'img.png', { type: 'image/png' });
    renderComponent({ files: [file], onFileRemove });
    fireEvent.click(screen.getByRole('button', { name: /remove file/i }));
    expect(onFileRemove).toHaveBeenCalledWith(file);
  });

  it('invokes onDrop when submit button clicked', () => {
    const onDrop = jest.fn();
    renderComponent({ canSubmit: true, showSubmit: true, onDrop });
    fireEvent.click(screen.getByRole('button', { name: 'Drop' }));
    expect(onDrop).toHaveBeenCalled();
  });

  it('calls onViewChange when cancel button or content triggers', () => {
    const onViewChange = jest.fn();
    renderComponent({ onViewChange });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onViewChange).toHaveBeenCalledWith(CreateDropViewType.COMPACT);
    fireEvent.click(screen.getByTestId('content'));
    expect(onViewChange).toHaveBeenCalledTimes(2);
  });
});
