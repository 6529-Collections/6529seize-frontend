import { act, renderHook } from "@testing-library/react";
import useWaveMessagesStore from "@/contexts/wave/hooks/useWaveMessagesStore";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";

const makeDrop = (id: string, content: string) =>
  convertApiDropToExtendedDrop(
    Object.assign(new ApiDrop(), {
      id,
      serial_no: id.startsWith("temp-") ? 1000 : 2,
      created_at: 1000,
      updated_at: null,
      wave: { id: "wave" },
      author: { id: "author", handle: "author" },
      title: null,
      metadata: [],
      parts: [{ part_id: 1, content, media: [], attachments: [] }],
    })
  );

it.each([false, true])(
  "atomically accepts a send with an earlier echo=%s",
  (echoFirst) => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useWaveMessagesStore());
      const observations: string[][] = [];
      const pending = makeDrop("temp-pending", "Before server normalization");
      const accepted = makeDrop("accepted", "After server normalization");
      act(() => {
        result.current.updateData({ key: "wave", drops: [pending] });
        result.current.subscribe("wave", (messages) =>
          observations.push(messages?.drops.map((row) => row.id) ?? [])
        );
      });
      act(() => jest.runOnlyPendingTimers());
      observations.length = 0;
      act(() => {
        if (echoFirst)
          result.current.updateData({ key: "wave", drops: [accepted] });
        result.current.updateData({
          key: "wave",
          drops: [accepted],
          pendingDropId: pending.id,
        });
      });
      act(() => jest.runOnlyPendingTimers());
      expect(observations).toEqual([["accepted"]]);
      expect(result.current.getData("wave")?.drops).toHaveLength(1);
      if (!echoFirst)
        expect(result.current.getData("wave")?.drops[0]?.stableKey).toBe(
          pending.stableKey
        );
    } finally {
      jest.useRealTimers();
    }
  }
);
