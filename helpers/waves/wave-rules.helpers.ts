import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import type { DisplayTimeZone } from "@/lib/display-time-zone/displayTimeZone";
import type { CreateWaveConfig } from "@/types/waves.types";
import { getCreateRules } from "./wave-create-rules.helpers";
import { getWaveRules } from "./wave-existing-rules.helpers";
import type { WaveRules } from "./wave-rules.shared";

export type { WaveCustomRules, WaveRules } from "./wave-rules.shared";

type BuildWaveRulesInput =
  | {
      readonly wave: ApiWave;
      readonly metadata?: readonly ApiWaveMetadata[] | null | undefined;
      /** The viewer's display time zone for schedule times. */
      readonly zone?: DisplayTimeZone | undefined;
    }
  | {
      readonly config: CreateWaveConfig;
      readonly groupsCache?: Readonly<Record<string, ApiGroupFull>> | undefined;
    };

export const buildWaveRules = (input: BuildWaveRulesInput): WaveRules => {
  if ("wave" in input) {
    return getWaveRules({
      wave: input.wave,
      metadata: input.metadata,
      zone: input.zone,
    });
  }

  return getCreateRules({
    config: input.config,
    groupsCache: input.groupsCache,
  });
};
