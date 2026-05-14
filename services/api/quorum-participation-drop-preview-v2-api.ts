import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import { commonApiFetch } from "@/services/api/common-api";
import { mapApiWaveOverviewToApiWaveMin } from "@/services/api/drop-v2-mappers";
import { mapLeaderboardDropV2 } from "@/services/api/wave-drops-v2-api";

const SERIAL_PREVIEW_BATCH_SIZE = 100;

interface FetchQuorumParticipationDropPreviewBySerialNoV2Props {
  readonly waveId: string;
  readonly serialNo: number;
  readonly signal?: AbortSignal | undefined;
}

interface PendingSerialPreviewRequest {
  readonly waveId: string;
  readonly resolve: (drop: ApiDrop | null) => void;
  readonly reject: (error: unknown) => void;
}

let pendingSerialPreviewRequests = new Map<
  number,
  PendingSerialPreviewRequest[]
>();
let isSerialPreviewBatchScheduled = false;

const getUniqueSerialNos = (serialNos: readonly number[]): number[] => {
  const uniqueSerialNos: number[] = [];
  const seenSerialNos = new Set<number>();

  for (const serialNo of serialNos) {
    if (!Number.isFinite(serialNo) || seenSerialNos.has(serialNo)) {
      continue;
    }

    seenSerialNos.add(serialNo);
    uniqueSerialNos.push(serialNo);
  }

  return uniqueSerialNos;
};

const chunkSerialNos = (serialNos: readonly number[]): number[][] => {
  const chunks: number[][] = [];

  for (let i = 0; i < serialNos.length; i += SERIAL_PREVIEW_BATCH_SIZE) {
    chunks.push(serialNos.slice(i, i + SERIAL_PREVIEW_BATCH_SIZE));
  }

  return chunks;
};

const mapSerialPreviewDrop = ({
  drop,
  expectedWaveId,
}: {
  readonly drop: ApiDropV2 | undefined;
  readonly expectedWaveId: string;
}): ApiDrop | null => {
  if (!drop) {
    return null;
  }

  const waveOverview = drop.wave;
  if (waveOverview?.id !== expectedWaveId) {
    return null;
  }

  const wave = mapApiWaveOverviewToApiWaveMin(waveOverview);
  return {
    ...mapLeaderboardDropV2({ drop, wave }),
    wave,
  };
};

const fetchSerialPreviewChunk = async (
  serialNos: readonly number[]
): Promise<Map<number, ApiDropV2>> => {
  const response = await commonApiFetch<ApiDropV2PageWithoutCount>({
    endpoint: "v2/drops",
    params: {
      serial_nos: serialNos.join(","),
      page_size: serialNos.length.toString(),
    },
  });

  return new Map(response.data.map((drop) => [drop.serial_no, drop]));
};

const flushSerialPreviewRequests = async () => {
  const currentRequests = pendingSerialPreviewRequests;
  pendingSerialPreviewRequests = new Map();
  isSerialPreviewBatchScheduled = false;

  const serialNoChunks = chunkSerialNos(
    getUniqueSerialNos([...currentRequests.keys()])
  );

  await Promise.all(
    serialNoChunks.map(async (serialNos) => {
      try {
        const dropsBySerialNo = await fetchSerialPreviewChunk(serialNos);

        for (const serialNo of serialNos) {
          const drop = dropsBySerialNo.get(serialNo);
          const requests = currentRequests.get(serialNo) ?? [];
          requests.forEach((request) =>
            request.resolve(
              mapSerialPreviewDrop({
                drop,
                expectedWaveId: request.waveId,
              })
            )
          );
        }
      } catch (error) {
        for (const serialNo of serialNos) {
          const requests = currentRequests.get(serialNo) ?? [];
          requests.forEach((request) => request.reject(error));
        }
      }
    })
  );
};

const scheduleSerialPreviewBatchFlush = () => {
  if (isSerialPreviewBatchScheduled) {
    return;
  }

  isSerialPreviewBatchScheduled = true;
  setTimeout(() => {
    void flushSerialPreviewRequests();
  }, 0);
};

export async function fetchQuorumParticipationDropPreviewBySerialNoV2({
  waveId,
  serialNo,
}: FetchQuorumParticipationDropPreviewBySerialNoV2Props): Promise<ApiDrop | null> {
  return new Promise((resolve, reject) => {
    if (!Number.isFinite(serialNo)) {
      resolve(null);
      return;
    }

    const requests = pendingSerialPreviewRequests.get(serialNo) ?? [];
    pendingSerialPreviewRequests.set(serialNo, [
      ...requests,
      { waveId, resolve, reject },
    ]);
    scheduleSerialPreviewBatchFlush();
  });
}
