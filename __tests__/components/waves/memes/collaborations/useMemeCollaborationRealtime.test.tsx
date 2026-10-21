import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WsMessageType } from "@/helpers/Types";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useMemeCollaborationRealtime } from "@/components/waves/memes/collaborations/useMemeCollaborationRealtime";

const callbacks = new Map<WsMessageType, (value: unknown) => void>();
let connected = false;
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (
    type: WsMessageType,
    callback: (value: unknown) => void
  ) => {
    callbacks.set(type, callback);
    return { isConnected: connected };
  },
}));
it("refreshes only the matching profile/drop and recovers after reconnecting", () => {
  const client = new QueryClient();
  const invalidate = jest
    .spyOn(client, "invalidateQueries")
    .mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { rerender } = renderHook(
    () => useMemeCollaborationRealtime("drop", "B"),
    { wrapper }
  );
  act(() =>
    callbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
      profile_id: "stranger",
    })
  );
  act(() => callbacks.get(WsMessageType.DROP_UPDATE)?.({ id: "other" }));
  act(() =>
    callbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.(null)
  );
  act(() => callbacks.get(WsMessageType.DROP_UPDATE)?.(null));
  expect(invalidate).not.toHaveBeenCalled();
  act(() =>
    callbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
      profile_id: "B",
    })
  );
  act(() => callbacks.get(WsMessageType.DROP_UPDATE)?.({ id: "drop" }));
  expect(invalidate).toHaveBeenCalledTimes(2);
  connected = true;
  rerender();
  expect(invalidate).toHaveBeenCalledTimes(3);
  expect(invalidate).toHaveBeenLastCalledWith({
    queryKey: [QueryKey.DROP, "collaborations", "drop"],
  });
});
