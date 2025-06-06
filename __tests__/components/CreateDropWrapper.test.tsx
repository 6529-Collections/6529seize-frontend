import { act } from "@testing-library/react";
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import CreateDropWrapper from '../../components/drops/create/utils/CreateDropWrapper';
const CreateDropViewType = { COMPACT: 'COMPACT', FULL: 'FULL' } as const;

const setDrop = jest.fn();

jest.mock('../../components/drops/create/compact/CreateDropCompact', () =>
  React.forwardRef((props: any) => (
    <button data-testid="compact" onClick={() => props.onDropPart()} />
  ))
);

jest.mock('../../components/drops/create/full/CreateDropFull', () =>
  React.forwardRef((props: any) => (
    <button data-testid="full" onClick={() => props.onDropPart()} />
  ))
);

jest.mock('@lexical/markdown', () => ({ $convertToMarkdownString: () => 'text', TRANSFORMERS: [] }));
jest.mock('../../components/drops/create/lexical/transformers/MentionTransformer', () => ({}));
jest.mock('../../components/drops/create/lexical/transformers/HastagTransformer', () => ({}));
jest.mock('../../components/drops/create/lexical/transformers/ImageTransformer', () => ({}));
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: null }) }));

const profile = { id: '1', handle: 'u', pfp: null, banner1_color: null, banner2_color: null, cic:0, rep:0, tdh:0, level:0, primary_address:'0x' } as any;

beforeEach(() => {
  (global as any).ResizeObserver = class { observe(){} disconnect(){} };
});
describe('CreateDropWrapper', () => {
  it('renders compact component', () => {
    render(
      <CreateDropWrapper
        profile={profile}
        quotedDrop={null}
        type={0 as any}
        loading={false}
        title={null}
        metadata={[]}
        mentionedUsers={[]}
        referencedNfts={[]}
        drop={null}
        viewType={CreateDropViewType.COMPACT}
        showSubmit={false}
        wave={null}
        waveId={null}
        setIsStormMode={jest.fn()}
        setViewType={jest.fn()}
        setDrop={setDrop}
        setMentionedUsers={jest.fn()}
        setReferencedNfts={jest.fn()}
        onMentionedUser={jest.fn()}
        setTitle={jest.fn()}
        setMetadata={jest.fn()}
        onSubmitDrop={jest.fn()}
      >
        child
      </CreateDropWrapper>
    );
    expect(screen.getByTestId('compact')).toBeInTheDocument();
  });

  it('calls setDrop when part added', () => {
    render(
      <CreateDropWrapper
        profile={profile}
        quotedDrop={null}
        type={0 as any}
        loading={false}
        title={'t'}
        metadata={[]}
        mentionedUsers={[]}
        referencedNfts={[]}
        drop={null}
        viewType={CreateDropViewType.FULL}
        showSubmit={false}
        wave={null}
        waveId={null}
        setIsStormMode={jest.fn()}
        setViewType={jest.fn()}
        setDrop={setDrop}
        setMentionedUsers={jest.fn()}
        setReferencedNfts={jest.fn()}
        onMentionedUser={jest.fn()}
        setTitle={jest.fn()}
        setMetadata={jest.fn()}
        onSubmitDrop={jest.fn()}
      >
        child
      </CreateDropWrapper>
    );
    fireEvent.click(screen.getByTestId('full'));
    expect(setDrop).toHaveBeenCalled();
  });

  it('exposes requestDrop via ref', () => {
    const ref = React.createRef<any>();
    render(
      <CreateDropWrapper
        ref={ref}
        profile={profile}
        quotedDrop={null}
        type={0 as any}
        loading={false}
        title={'t'}
        metadata={[]}
        mentionedUsers={[]}
        referencedNfts={[]}
        drop={null}
        viewType={CreateDropViewType.FULL}
        showSubmit={false}
        wave={null}
        waveId={null}
        setIsStormMode={jest.fn()}
        setViewType={jest.fn()}
        setDrop={setDrop}
        setMentionedUsers={jest.fn()}
        setReferencedNfts={jest.fn()}
        onMentionedUser={jest.fn()}
        setTitle={jest.fn()}
        setMetadata={jest.fn()}
        onSubmitDrop={jest.fn()}
      >child</CreateDropWrapper>
    );
    let result: any;
    act(() => {
      result = ref.current!.requestDrop();
    });
    expect(setDrop).toHaveBeenCalled();
  });
});
