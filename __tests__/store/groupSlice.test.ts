import { groupSlice, setActiveGroupId, selectActiveGroupId } from '@/store/groupSlice';
import { HYDRATE } from 'next-redux-wrapper';

describe('groupSlice', () => {
  it('updates activeGroupId with setActiveGroupId', () => {
    let state = groupSlice.reducer(undefined, { type: 'init' });
    state = groupSlice.reducer(state, setActiveGroupId('g1'));
    expect(state.activeGroupId).toBe('g1');
  });

  it('hydrates state on HYDRATE action', () => {
    const initial = groupSlice.reducer(undefined, { type: 'init' });
    const nextState = groupSlice.reducer(initial, {
      type: HYDRATE,
      payload: { counter: { activeGroupId: 'h1' } },
    } as any);
    expect(nextState.activeGroupId).toBe('h1');
  });

  it('selectActiveGroupId returns value', () => {
    const state = { group: { activeGroupId: 'x' } } as any;
    expect(selectActiveGroupId(state)).toBe('x');
  });
});
