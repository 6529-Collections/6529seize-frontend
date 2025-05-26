import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import CreateDropFull, { CreateDropFullHandles } from '../../../../../components/drops/create/full/CreateDropFull';
import { CreateDropScreenType } from '../../../../../components/drops/create/utils/CreateDropWrapper';
import { CreateDropType } from '../../../../../components/drops/create/types';

jest.mock('react-use', () => ({
  createBreakpoint: () => () => 'LG',
}));

const desktopClearMock = jest.fn();
const mobileClearMock = jest.fn();

jest.mock('../../../../../components/drops/create/full/desktop/CreateDropFullDesktop', () => {
  return React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({ clearEditorState: desktopClearMock }));
    return <div data-testid="desktop">{props.children}</div>;
  });
});

jest.mock('../../../../../components/drops/create/full/mobile/CreateDropFullMobile', () => {
  return React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({ clearEditorState: mobileClearMock }));
    return <div data-testid="mobile">{props.children}</div>;
  });
});

function renderComponent(screenType: CreateDropScreenType) {
  const ref = createRef<CreateDropFullHandles>();
  render(
    <CreateDropFull
      ref={ref}
      screenType={screenType}
      profile={{} as any}
      title={null}
      metadata={[]}
      editorState={null}
      files={[]}
      canSubmit={false}
      canAddPart={false}
      loading={false}
      showSubmit={false}
      type={CreateDropType.DROP}
      drop={null}
      showDropError={false}
      missingMedia={[]}
      missingMetadata={[]}
      waveId={null}
      onTitle={jest.fn()}
      onMetadataEdit={jest.fn()}
      onMetadataRemove={jest.fn()}
      onViewChange={jest.fn()}
      onEditorState={jest.fn()}
      onMentionedUser={jest.fn()}
      onReferencedNft={jest.fn()}
      onFileRemove={jest.fn()}
      setFiles={jest.fn()}
      onDrop={jest.fn()}
      onDropPart={jest.fn()}
    >
      child
    </CreateDropFull>
  );
  return ref;
}

describe('CreateDropFull', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders desktop component and delegates clearEditorState', () => {
    const ref = renderComponent(CreateDropScreenType.DESKTOP);
    expect(screen.getByTestId('desktop')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile')).toBeNull();
    ref.current?.clearEditorState();
    expect(desktopClearMock).toHaveBeenCalled();
    expect(mobileClearMock).not.toHaveBeenCalled();
  });

  it('renders mobile component and delegates clearEditorState', () => {
    const ref = renderComponent(CreateDropScreenType.MOBILE);
    expect(screen.getByTestId('mobile')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop')).toBeNull();
    ref.current?.clearEditorState();
    expect(mobileClearMock).toHaveBeenCalled();
    expect(desktopClearMock).not.toHaveBeenCalled();
  });
});

