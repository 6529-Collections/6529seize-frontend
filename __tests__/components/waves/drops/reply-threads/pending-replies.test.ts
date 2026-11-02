import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import {
  convertApiDropToExtendedDrop,
  DropClientDeliveryState,
} from "@/helpers/waves/drop.helpers";
import {
  getVisibleThreadReplies,
  removeTemporaryThreadReply,
} from "@/components/waves/drops/reply-threads/pending-replies";

const makeDrop = (id: string, parent = "root"): ApiDrop =>
  Object.assign(new ApiDrop(), {
    id,
    serial_no: 20,
    created_at: 100,
    wave: Object.assign(new ApiWaveMin(), { id: "wave" }),
    author: Object.assign(new ApiProfileMin(), {
      id: "sender",
      handle: "sender",
    }),
    title: null,
    metadata: [],
    parts: [
      {
        part_id: 1,
        content: "my reply",
        media: [],
        attachments: [],
        quoted_drop: null,
      },
    ],
    reply_to: { drop_id: parent, drop_part_id: 1, is_deleted: false },
  });
const page = (drops: ApiDrop[]): ApiWaveDropsFeed =>
  Object.assign(new ApiWaveDropsFeed(), {
    wave: Object.assign(new ApiWaveMin(), { id: "wave" }),
    drops,
  });
const visible = (stream: ApiDrop[], pages?: ApiWaveDropsFeed[]) =>
  getVisibleThreadReplies({
    pages,
    previous: [],
    streamDrops: stream.map(convertApiDropToExtendedDrop),
    parentDropId: "root",
  });

describe("collapsed reply thread data", () => {
  it("shows the sender's first optimistic reply without a reply-query cache", () => {
    expect(visible([makeDrop("temp-first")]).map((drop) => drop.id)).toEqual([
      "temp-first",
    ]);
  });
  it("keeps the pending reply when the read finishes before the create request", () => {
    expect(
      visible([makeDrop("temp-first")], [page([])]).map((drop) => drop.id)
    ).toEqual(["temp-first"]);
  });
  it("shows the saved stream reply even if a stale empty read finishes after the save", () => {
    expect(
      visible([makeDrop("saved")], [page([])]).map((drop) => drop.id)
    ).toEqual(["saved"]);
    expect(
      visible([makeDrop("saved")], [page([makeDrop("saved")])]).map(
        (drop) => drop.id
      )
    ).toEqual(["saved"]);
  });
  it("does not duplicate a reply received over WebSockets before POST completion", () => {
    expect(
      visible([makeDrop("temp-first")], [page([makeDrop("saved")])]).map(
        (drop) => drop.id
      )
    ).toEqual(["saved"]);
  });
  it("removes failed/completed temporary cache rows while preserving other sends", () => {
    const client = new QueryClient();
    const key = [QueryKey.DROPS, { waveId: "wave", dropId: "root", limit: 50 }];
    client.setQueryData(key, {
      pages: [page([makeDrop("temp-first"), makeDrop("temp-second")])],
      pageParams: [null],
    });
    removeTemporaryThreadReply(client, "wave", "temp-first");
    const data = client.getQueryData<{
      pages: ApiWaveDropsFeed[];
      pageParams: unknown[];
    }>(key)!;
    expect(
      visible([makeDrop("temp-second")], data.pages).map((drop) => drop.id)
    ).toEqual(["temp-second"]);
    expect(data.pageParams).toEqual([null]);
    removeTemporaryThreadReply(client, "wave", "temp-second");
    expect(
      visible(
        [],
        client.getQueryData<{ pages: ApiWaveDropsFeed[] }>(key)?.pages
      )
    ).toEqual([]);
  });
  it("includes nested replies but excludes a different thread", () => {
    const nested = makeDrop("temp-nested", "child");
    nested.reply_to!.drop = makeDrop("child");
    expect(
      visible([nested, makeDrop("other", "different-root")]).map(
        (drop) => drop.id
      )
    ).toEqual(["temp-nested"]);
  });
  it("cleans ancestor threads without changing main-feed or other-wave caches", () => {
    const client = new QueryClient();
    const key = (waveId: string, dropId: string | null) => [
      QueryKey.DROPS,
      { waveId, dropId, limit: 50 },
    ];
    const mainKey = key("wave", null);
    const otherWaveKey = key("other-wave", "root");
    const cached = {
      pages: [page([makeDrop("temp-nested")])],
      pageParams: [null],
    };
    [mainKey, otherWaveKey, key("wave", "root"), key("wave", "child")].forEach(
      (queryKey) => client.setQueryData(queryKey, cached)
    );

    removeTemporaryThreadReply(client, "wave", "temp-nested");

    expect(client.getQueryData(mainKey)).toBe(cached);
    expect(client.getQueryData(otherWaveKey)).toBe(cached);
    ["root", "child"].forEach((parent) =>
      expect(client.getQueryData(key("wave", parent))).toEqual({
        pages: [page([])],
        pageParams: [null],
      })
    );
  });
  it("uses the retained moderation failure state from the existing stream", () => {
    const rejected = {
      ...convertApiDropToExtendedDrop(makeDrop("temp-first")),
      clientDeliveryState: DropClientDeliveryState.MODERATION_REJECTED,
    };
    const replies = getVisibleThreadReplies({
      pages: [page([makeDrop("temp-first")])],
      previous: [],
      streamDrops: [rejected],
      parentDropId: "root",
    });
    expect(replies[0]?.clientDeliveryState).toBe(
      DropClientDeliveryState.MODERATION_REJECTED
    );
  });
});
