import { WsMessageType } from "@/helpers/Types";
import { useWebSocket } from "@/services/websocket";
import throttle from "lodash/throttle";
import { useCallback, useEffect, useMemo } from "react";

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
