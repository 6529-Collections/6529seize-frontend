"use client";

import { useCallback, useEffect } from "react";
import { WsMessageType } from "@/helpers/Types";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";

type SubscriptionRecord = {
  count: number;
  subscribed: boolean;
};

const subscriptionRegistry: Map<string, SubscriptionRecord> = new Map();

function setRecord(waveId: string, updater: (record: SubscriptionRecord | undefined) => SubscriptionRecord | undefined) {
  const next = updater(subscriptionRegistry.get(waveId));
  if (!next) {
    subscriptionRegistry.delete(waveId);
    return;
  }
  subscriptionRegistry.set(waveId, next);
}

function ensurePositiveCount(count: number): number {
  return count < 0 ? 0 : count;
}

export function useWaveSubscriptionManager() {
  const { send, status } = useWebSocket();

  const debugLog = useCallback((message: string, waveId: string, extra?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console -- intentional diagnostic logging
    console.debug(`[WaveSubscription] ${message}`, {
      waveId,
      ...extra,
    });
  }, []);

  const subscribeToWave = useCallback(
    (waveId: string | null | undefined) => {
      if (!waveId) return;
      setRecord(waveId, (current) => {
        const nextCount = ensurePositiveCount((current?.count ?? 0) + 1);
        const alreadySubscribed = current?.subscribed ?? false;
        const shouldSend =
          !alreadySubscribed && status === WebSocketStatus.CONNECTED;

        if (shouldSend) {
          send(WsMessageType.SUBSCRIBE_TO_WAVE, {
            subscribe: true,
            wave_id: waveId,
          });
          debugLog("subscribe request sent", waveId, {
            count: nextCount,
          });
        }

        debugLog("subscription count updated", waveId, {
          count: nextCount,
          subscribed: alreadySubscribed || shouldSend,
        });

        return {
          count: nextCount,
          subscribed: alreadySubscribed || shouldSend,
        };
      });
    },
    [debugLog, send, status]
  );

  const unsubscribeFromWave = useCallback(
    (waveId: string | null | undefined) => {
      if (!waveId) return;
      setRecord(waveId, (current) => {
        if (!current) return undefined;
        const nextCount = ensurePositiveCount(current.count - 1);

        if (nextCount === 0) {
          if (current.subscribed && status === WebSocketStatus.CONNECTED) {
            send(WsMessageType.SUBSCRIBE_TO_WAVE, {
              subscribe: false,
              wave_id: waveId,
            });
            debugLog("unsubscribe request sent", waveId, { count: 0 });
          }
          return undefined;
        }

        debugLog("subscription count updated", waveId, {
          count: nextCount,
          subscribed: current.subscribed,
        });

        return {
          count: nextCount,
          subscribed: current.subscribed,
        };
      });
    },
    [debugLog, send, status]
  );

  useEffect(() => {
    if (status === WebSocketStatus.CONNECTED) {
      subscriptionRegistry.forEach((record, waveId) => {
        if (record.count > 0 && !record.subscribed) {
          send(WsMessageType.SUBSCRIBE_TO_WAVE, {
            subscribe: true,
            wave_id: waveId,
          });
          debugLog("resubscribe on reconnect", waveId, {
            count: record.count,
          });
          subscriptionRegistry.set(waveId, {
            count: record.count,
            subscribed: true,
          });
        }
      });
      return;
    }

    subscriptionRegistry.forEach((record, waveId) => {
      if (record.subscribed) {
        subscriptionRegistry.set(waveId, {
          count: record.count,
          subscribed: false,
        });
        debugLog("mark unsubscribed (socket non-connected)", waveId, {
          count: record.count,
          status,
        });
      }
    });
  }, [debugLog, send, status]);

  return {
    subscribeToWave,
    unsubscribeFromWave,
  };
}
