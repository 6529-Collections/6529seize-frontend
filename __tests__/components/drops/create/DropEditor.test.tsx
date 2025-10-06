import React, { createRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import DropEditor from '@/components/drops/create/DropEditor';
import { CreateDropType, CreateDropViewType } from '@/components/drops/create/types';

jest.mock('@/components/drops/create/utils/CreateDropWrapper', () => {
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ requestDrop: () => ({ id: 'drop' }) }));
    return <div data-testid="wrapper">{JSON.stringify({ drop: props.drop, viewType: props.viewType })}</div>;
  });
});

function setup(refreshKey = 0) {
  const ref = createRef<any>();
  const profile = { handle: 'user' } as any;
  render(
    <DropEditor
      ref={ref}
      profile={profile}
      quotedDrop={null}
      type={CreateDropType.DROP}
      loading={false}
      dropEditorRefreshKey={refreshKey}
      wave={null}
      waveId={null}
      onSubmitDrop={jest.fn()}
    />
  );
  return ref;
}

test('exposes requestDrop via ref', () => {
  const ref = setup();
  expect(ref.current?.requestDrop()).toEqual({ id: 'drop' });
});

test('resets state when refresh key changes', () => {
  const ref1 = setup(0);
  act(() => {
    ref1.current?.requestDrop();
  });
  setup(1);
  const wrappers = screen.getAllByTestId('wrapper');
  const last = wrappers[wrappers.length - 1];
  expect(last).toHaveTextContent('"drop":null');
  expect(last).toHaveTextContent(`"viewType":"${CreateDropViewType.COMPACT}"`);
});
