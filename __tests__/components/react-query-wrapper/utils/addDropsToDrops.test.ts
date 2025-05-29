import { QueryClient } from '@tanstack/react-query';
import { addDropToDrops } from '../../../../components/react-query-wrapper/utils/addDropsToDrops';
import { QueryKey } from '../../../../components/react-query-wrapper/ReactQueryWrapper';

test('adds drop to relevant caches', () => {
  const qc = new QueryClient();
  const baseKey = [QueryKey.DROPS, { limit: 50, waveId: 'w', dropId: null }];
  const replyKey = [QueryKey.DROPS, { limit: 50, waveId: 'w', dropId: 'r' }];
  qc.setQueryData(baseKey, { pages: [{ drops: [{ id: 'old' }] }] });
  qc.setQueryData(replyKey, { pages: [{ drops: [{ id: 'old' }] }] });
  const drop: any = { id: 'new', wave: { id: 'w' }, reply_to: { drop_id: 'r' } };
  addDropToDrops(qc, { drop });
  expect((qc.getQueryData(baseKey) as any).pages[0].drops[0].id).toBe('new');
  expect((qc.getQueryData(replyKey) as any).pages[0].drops[0].id).toBe('new');
});
