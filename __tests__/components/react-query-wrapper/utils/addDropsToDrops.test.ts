import { QueryClient } from "@tanstack/react-query";
import {
  addDropToDrops,
  upsertDropIntoMatchingDropsQueries,
} from "@/components/react-query-wrapper/utils/addDropsToDrops";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

test("adds drop to relevant caches", () => {
  const qc = new QueryClient();
  const baseKey = [QueryKey.DROPS, { limit: 50, waveId: "w", dropId: null }];
  const replyKey = [QueryKey.DROPS, { limit: 50, waveId: "w", dropId: "r" }];
  qc.setQueryData(baseKey, { pages: [{ drops: [{ id: "old" }] }] });
  qc.setQueryData(replyKey, { pages: [{ drops: [{ id: "old" }] }] });
  const drop: any = {
    id: "new",
    wave: { id: "w" },
    reply_to: { drop_id: "r" },
  };
  addDropToDrops(qc, { drop });
  expect((qc.getQueryData(baseKey) as any).pages[0].drops[0].id).toBe("new");
  expect((qc.getQueryData(replyKey) as any).pages[0].drops[0].id).toBe("new");
});

test("upserts websocket drops into active wave feed caches", () => {
  const qc = new QueryClient();
  const activeWaveKey = [
    QueryKey.DROPS,
    {
      waveId: "w",
      limit: 20,
      dropType: null,
      containsMedia: false,
      curationId: null,
      context: "wave-drops",
    },
  ];
  const otherWaveKey = [
    QueryKey.DROPS,
    {
      waveId: "other",
      limit: 20,
      dropType: null,
      containsMedia: false,
      curationId: null,
      context: "wave-drops",
    },
  ];
  qc.setQueryData(activeWaveKey, { pages: [{ drops: [{ id: "old" }] }] });
  qc.setQueryData(otherWaveKey, { pages: [{ drops: [{ id: "other-old" }] }] });

  const drop: any = { id: "new", wave: { id: "w" }, parts: [] };
  upsertDropIntoMatchingDropsQueries(qc, { drop });

  expect((qc.getQueryData(activeWaveKey) as any).pages[0].drops[0].id).toBe(
    "new"
  );
  expect((qc.getQueryData(otherWaveKey) as any).pages[0].drops[0].id).toBe(
    "other-old"
  );
});

test("skips media-filtered caches when websocket drop omits parts", () => {
  const qc = new QueryClient();
  const activeWaveKey = [
    QueryKey.DROPS,
    {
      waveId: "w",
      limit: 20,
      dropType: null,
      containsMedia: true,
      curationId: null,
      context: "wave-drops",
    },
  ];
  qc.setQueryData(activeWaveKey, { pages: [{ drops: [{ id: "old" }] }] });

  const drop: any = { id: "new", wave: { id: "w" } };
  expect(() => upsertDropIntoMatchingDropsQueries(qc, { drop })).not.toThrow();
  expect((qc.getQueryData(activeWaveKey) as any).pages[0].drops[0].id).toBe(
    "old"
  );
});

test("upserts websocket reply drops into matching reply caches", () => {
  const qc = new QueryClient();
  const baseKey = [QueryKey.DROPS, { limit: 50, waveId: "w", dropId: null }];
  const matchingReplyKey = [
    QueryKey.DROPS,
    { limit: 50, waveId: "w", dropId: "parent-drop" },
  ];
  const otherReplyKey = [
    QueryKey.DROPS,
    { limit: 50, waveId: "w", dropId: "other-parent" },
  ];
  qc.setQueryData(baseKey, { pages: [{ drops: [{ id: "old" }] }] });
  qc.setQueryData(matchingReplyKey, {
    pages: [{ drops: [{ id: "reply-old" }] }],
  });
  qc.setQueryData(otherReplyKey, { pages: [{ drops: [{ id: "other-old" }] }] });

  const drop: any = {
    id: "bot-reply",
    wave: { id: "w" },
    reply_to: { drop_id: "parent-drop" },
    parts: [],
  };
  upsertDropIntoMatchingDropsQueries(qc, { drop });

  expect((qc.getQueryData(baseKey) as any).pages[0].drops[0].id).toBe(
    "bot-reply"
  );
  expect((qc.getQueryData(matchingReplyKey) as any).pages[0].drops[0].id).toBe(
    "bot-reply"
  );
  expect((qc.getQueryData(otherReplyKey) as any).pages[0].drops[0].id).toBe(
    "other-old"
  );
});

test("replaces existing websocket drops instead of duplicating them", () => {
  const qc = new QueryClient();
  const activeWaveKey = [
    QueryKey.DROPS,
    {
      waveId: "w",
      limit: 20,
      dropType: null,
      containsMedia: false,
      curationId: null,
      context: "wave-drops",
    },
  ];
  qc.setQueryData(activeWaveKey, {
    pages: [{ drops: [{ id: "drop-1", rating: 1 }] }],
  });

  const drop: any = { id: "drop-1", rating: 2, wave: { id: "w" }, parts: [] };
  upsertDropIntoMatchingDropsQueries(qc, { drop });

  expect((qc.getQueryData(activeWaveKey) as any).pages[0].drops).toEqual([
    drop,
  ]);
});

test("skips media-only caches when a websocket drop omits parts", () => {
  const qc = new QueryClient();
  const mediaKey = [
    QueryKey.DROPS,
    {
      waveId: "w",
      limit: 20,
      dropType: null,
      containsMedia: true,
      curationId: null,
      context: "wave-drops",
    },
  ];
  const regularKey = [
    QueryKey.DROPS,
    {
      waveId: "w",
      limit: 20,
      dropType: null,
      containsMedia: false,
      curationId: null,
      context: "wave-drops",
    },
  ];
  qc.setQueryData(mediaKey, { pages: [{ drops: [{ id: "media-old" }] }] });
  qc.setQueryData(regularKey, { pages: [{ drops: [{ id: "regular-old" }] }] });

  const drop: any = { id: "partial-websocket-drop", wave: { id: "w" } };
  upsertDropIntoMatchingDropsQueries(qc, { drop });

  expect((qc.getQueryData(mediaKey) as any).pages[0].drops[0].id).toBe(
    "media-old"
  );
  expect((qc.getQueryData(regularKey) as any).pages[0].drops[0].id).toBe(
    "partial-websocket-drop"
  );
});
