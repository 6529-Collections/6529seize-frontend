import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiSubmissionDropContext } from "@/generated/models/ApiSubmissionDropContext";

export interface ApiDropV2View extends ApiDrop {
  readonly submission_context?: ApiSubmissionDropContext | undefined;
}

export interface ApiDropWithoutWaveV2View extends ApiDropWithoutWave {
  readonly submission_context?: ApiSubmissionDropContext | undefined;
}
