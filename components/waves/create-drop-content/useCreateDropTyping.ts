import { WsMessageType } from "@/helpers/Types";
import { useWebSocket } from "@/services/websocket";
import throttle from "lodash/throttle";
import { useCallback, useEffect, useMemo } from "react";

// Typing notifications synchronize editor state with the WebSocket; they do
// not pass derived data back into a React parent.
/* eslint-disable react-you-might-not-need-an-effect/no-pass-data-to-parent */
export function useCreateDropTyping({
  markdown,
  waveId,
}: {
  readonly markdown: string | null;
  readonly waveId: string;
}) {
  const { send } = useWebSocket();
  const sendTyping = useCallback(() => {
    send(WsMessageType.USER_IS_TYPING, { wave_id: waveId });
  }, [send, waveId]);
  const throttledSendTyping = useMemo(
    () => throttle(sendTyping, 4000),
    [sendTyping]
  );

  useEffect(() => {
    if (markdown === null || markdown.length === 0) {
      throttledSendTyping.cancel();
      return;
    }

    throttledSendTyping();
  }, [markdown, throttledSendTyping]);

  useEffect(
    () => () => throttledSendTyping.cancel(),
    [throttledSendTyping]
  );
}
