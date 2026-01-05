import { mapToExtendedDrops, generateUniqueKeys } from '@/helpers/waves/wave-drops.helpers';
import { getStableDropKey } from '@/helpers/waves/drop.helpers';

jest.mock('@/helpers/waves/drop.helpers', () => ({
  getStableDropKey: jest.fn(({ id }: any) => ({ key: `k${id}`, hash: `h${id}` })),
  DropSize: { FULL: 'FULL' }
}));

const wave = { id: 'w' } as any;

test('mapToExtendedDrops maps and reverses order', () => {
  const pages = [{ wave, drops: [{ id: '1' }, { id: '2' }] }] as any;
  const res = mapToExtendedDrops(pages, [], true);
  expect((getStableDropKey as jest.Mock).mock.calls.length).toBe(2);
  expect(res[0]?.stableKey).toBe('k2');
  expect(res[1]?.wave).toBe(wave);
});

test('generateUniqueKeys assigns unique keys', () => {
  const drops = [
    { stableKey: 'a', stableHash: '1' },
    { stableKey: 'a', stableHash: '2' },
    { stableKey: 'b', stableHash: '3' }
  ] as any;
  const prev = [{ stableKey: 'p', stableHash: '3' }] as any;
  const res = generateUniqueKeys(drops, prev);
  expect(res.map(d => d.stableKey)).toEqual(['a', 'a-2', 'b']);
});
