import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { acceptCreatedDrop } from "@/components/waves/create-drop-content/accept-created-drop";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater.helpers";
import { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDrop } from "@/generated/models/ApiDrop";

describe("accepted drop handoff", () => {
  it("settles a cached reply independently of the wave collapse setting", () => {
    const queryClient = new QueryClient();
    const key = [QueryKey.DROPS, { waveId: "wave", dropId: "parent" }];
    const pending = Object.assign(new ApiDrop(), { id: "temp-reply" });
    const accepted = Object.assign(new ApiDrop(), { id: "accepted" });
    queryClient.setQueryData(key, {
      pages: [{ drops: [pending] }],
      pageParams: [null],
    });
    const processIncomingDrop = jest.fn().mockResolvedValue(undefined);

    acceptCreatedDrop({
      serverDrop: accepted,
      body: {
        drop: Object.assign(new ApiCreateDropRequest(), {
          wave_id: "wave",
          reply_to: { drop_id: "parent", drop_part_id: 1 },
        }),
        dropId: pending.id,
      },
      queryClient,
      processIncomingDrop,
    });

    expect(processIncomingDrop).toHaveBeenCalledWith(
      accepted,
      ProcessIncomingDropType.DROP_INSERT,
      { pendingDropId: pending.id }
    );
    expect(queryClient.getQueryData(key)).toEqual({
      pages: [{ drops: [accepted] }],
      pageParams: [null],
    });
    queryClient.clear();
  });
});
