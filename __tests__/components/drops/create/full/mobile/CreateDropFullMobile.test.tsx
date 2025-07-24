import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropFullMobile from '../../../../../../components/drops/create/full/mobile/CreateDropFullMobile';
import { CreateDropType } from '../../../../../../components/drops/create/types';

jest.mock('../../../../../../components/drops/create/full/mobile/CreateDropFullMobileWrapper', () => (props: any) => <div data-testid="wrapper">{props.children}</div>);
jest.mock('../../../../../../components/drops/create/utils/CreateDropContent', () => React.forwardRef(() => <div data-testid="content" />));
jest.mock('../../../../../../components/drops/create/utils/file/CreateDropSelectedFileIcon', () => ({ file }: any) => <span data-testid="icon">{file.name}</span>);
jest.mock('../../../../../../components/drops/create/utils/file/CreateDropSelectedFilePreview', () => ({ file }: any) => <div data-testid="preview">{file.name}</div>);
jest.mock('../../../../../../components/distribution-plan-tool/common/CircleLoader', () => () => <div data-testid="loader" />);

describe('CreateDropFullMobile', () => {
  const onDrop = jest.fn();
  const onFileRemove = jest.fn();
  const onViewChange = jest.fn();
  const onTitle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderComponent(props: Partial<React.ComponentProps<typeof CreateDropFullMobile>> = {}) {
    const file = new File(['a'], 'file.png', { type: 'image/png' });
    return render(
      <CreateDropFullMobile
        ref={null}
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
        missingMedia={[]}
        missingMetadata={[]}
        waveId={null}
        onTitle={onTitle}
        onMetadataEdit={jest.fn()}
        onMetadataRemove={jest.fn()}
        onViewChange={onViewChange}
        onEditorState={jest.fn()}
        onMentionedUser={jest.fn()}
        onReferencedNft={jest.fn()}
        onFileRemove={onFileRemove}
        setFiles={jest.fn()}
        onDrop={onDrop}
        onDropPart={jest.fn()}
      >
        child
      </CreateDropFullMobile>
    );
  }

  it('shows title input after clicking add title', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /add title/i }));
    expect(screen.getByPlaceholderText('Drop title')).toBeInTheDocument();
  });

  it('calls onFileRemove when remove button clicked', () => {
    const file = new File(['a'], 'img.png', { type: 'image/png' });
    renderComponent({ files: [file] });
    fireEvent.click(screen.getByRole('button', { name: /remove file/i }));
    expect(onFileRemove).toHaveBeenCalledWith(file);
  });

  it('submits drop when button clicked', () => {
    renderComponent({ canSubmit: true, showSubmit: true });
    fireEvent.click(screen.getByRole('button', { name: 'Drop' }));
    expect(onDrop).toHaveBeenCalled();
  });
});
