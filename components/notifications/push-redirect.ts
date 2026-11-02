import { getUserPageTabByRoute } from "@/components/user/layout/userTabs.config";
import { getCompetitionRoute } from "@/helpers/competition.helpers";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import {
  getEncryptedMessagesRoute,
  getMessagesBaseRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";
import type { DevicePushData } from "./device-push.types";

const redirectConfig = {
  path: ({ path }: { path: string }) => `/${path}`,
  profile: ({ handle, subroute }: { handle: string; subroute?: string }) => {
    if (!subroute) return `/${handle}`;
    const validTab = getUserPageTabByRoute(subroute);
    if (!validTab) return `/${handle}`;
    return `/${handle}/${validTab.route}`;
  },
  "the-memes": ({ id }: { id: string }) => `/the-memes/${id}`,
  "6529-gradient": ({ id }: { id: string }) => `/6529-gradient/${id}`,
  "meme-lab": ({ id }: { id: string }) => `/meme-lab/${id}`,
  waves: ({
    wave_id,
    drop_id,
    competition_id,
    competition_entry_id,
  }: {
    wave_id: string;
    drop_id: string;
    competition_id?: string;
    competition_entry_id?: string;
  }) => {
    if (competition_id) {
      const entryQuery = competition_entry_id
        ? `?entry=${encodeURIComponent(competition_entry_id)}`
        : "";
      return getCompetitionRoute(wave_id, competition_id) + entryQuery;
    }
    return getWaveRoute({
      waveId: wave_id,
      serialNo: drop_id || undefined,
      isDirectMessage: false,
      isApp: false,
    });
  },
  // Content-free encrypted-chat wake: open the encrypted list; the engine
  // syncs and shows which chat changed. Builds without encrypted chats fall
  // back to the plaintext messages list.
  e2ee: () =>
    isE2eeEnabled() ? getEncryptedMessagesRoute() : getMessagesBaseRoute(true),
};

export const resolvePushRedirectUrl = (notificationData: DevicePushData) => {
  const { redirect, ...params } = notificationData;

  const resolveFn = redirectConfig[redirect];

  try {
    return (resolveFn as (params: Record<string, unknown>) => string)(params);
  } catch (error) {
    console.error("Error resolving redirect URL", error);
    return null;
  }
};
