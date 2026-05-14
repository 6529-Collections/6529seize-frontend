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
  readonly signal?: AbortSignal | undefined;
  readonly resolve: (drop: ApiDrop | null) => void;
  readonly reject: (error: unknown) => void;
}

interface EnqueueSerialPreviewRequest {
  readonly waveId: string;
  readonly serialNo: number;
  readonly signal?: AbortSignal | undefined;
}

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
  serialNos: readonly number[],
  signal: AbortSignal
): Promise<Map<number, ApiDropV2>> => {
  const response = await commonApiFetch<ApiDropV2PageWithoutCount>({
    endpoint: "v2/drops",
    params: {
      serial_nos: serialNos.join(","),
      page_size: serialNos.length.toString(),
    },
    signal,
  });

  return new Map(response.data.map((drop) => [drop.serial_no, drop]));
};

const createAbortError = (): DOMException =>
  new DOMException("Request aborted", "AbortError");

const getAbortError = (signal?: AbortSignal): unknown => {
  const signalWithReason = signal as
    | (AbortSignal & { readonly reason?: unknown })
    | undefined;
  return signalWithReason?.reason ?? createAbortError();
};

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  return error instanceof Error && error.name === "AbortError";
};

class SerialPreviewBatcher {
  private pendingSerialPreviewRequests = new Map<
    number,
    PendingSerialPreviewRequest[]
  >();
  private isSerialPreviewBatchScheduled = false;

  enqueue({
    waveId,
    serialNo,
    signal,
  }: EnqueueSerialPreviewRequest): Promise<ApiDrop | null> {
    return new Promise((resolve, reject) => {
      if (!Number.isFinite(serialNo)) {
        resolve(null);
        return;
      }

      if (signal?.aborted) {
        reject(getAbortError(signal));
        return;
      }

      const requests = this.pendingSerialPreviewRequests.get(serialNo) ?? [];
      this.pendingSerialPreviewRequests.set(serialNo, [
        ...requests,
        { waveId, signal, resolve, reject },
      ]);
      this.scheduleSerialPreviewBatchFlush();
    });
  }

  resetForTests(): void {
    this.pendingSerialPreviewRequests = new Map();
    this.isSerialPreviewBatchScheduled = false;
  }

  private scheduleSerialPreviewBatchFlush(): void {
    if (this.isSerialPreviewBatchScheduled) {
      return;
    }

    this.isSerialPreviewBatchScheduled = true;
    setTimeout(() => {
      void this.flushSerialPreviewRequests();
    }, 0);
  }

  private async flushSerialPreviewRequests(): Promise<void> {
    const currentRequests = this.pendingSerialPreviewRequests;
    this.pendingSerialPreviewRequests = new Map();
    this.isSerialPreviewBatchScheduled = false;

    const serialNoChunks = chunkSerialNos(
      getUniqueSerialNos([...currentRequests.keys()])
    );

    await Promise.all(
      serialNoChunks.map((serialNos) =>
        this.flushSerialPreviewChunk(serialNos, currentRequests)
      )
    );
  }

  private async flushSerialPreviewChunk(
    serialNos: readonly number[],
    currentRequests: ReadonlyMap<number, readonly PendingSerialPreviewRequest[]>
  ): Promise<void> {
    const chunkController = new AbortController();
    const activeRequests = new Set(
      serialNos.flatMap((serialNo) => currentRequests.get(serialNo) ?? [])
    );
    const cleanupCallbacks: Array<() => void> = [];

    const rejectActiveRequest = (
      request: PendingSerialPreviewRequest,
      error: unknown
    ) => {
      if (!activeRequests.delete(request)) {
        return;
      }

      request.reject(error);
      if (activeRequests.size === 0 && !chunkController.signal.aborted) {
        chunkController.abort();
      }
    };

    activeRequests.forEach((request) => {
      if (!request.signal) {
        return;
      }

      const abortRequest = () =>
        rejectActiveRequest(request, getAbortError(request.signal));

      if (request.signal.aborted) {
        abortRequest();
        return;
      }

      request.signal.addEventListener("abort", abortRequest, { once: true });
      cleanupCallbacks.push(() =>
        request.signal?.removeEventListener("abort", abortRequest)
      );
    });

    if (activeRequests.size === 0) {
      cleanupCallbacks.forEach((cleanup) => cleanup());
      return;
    }

    try {
      const dropsBySerialNo = await fetchSerialPreviewChunk(
        serialNos,
        chunkController.signal
      );

      for (const serialNo of serialNos) {
        const drop = dropsBySerialNo.get(serialNo);
        const requests = currentRequests.get(serialNo) ?? [];
        requests.forEach((request) => {
          if (!activeRequests.delete(request)) {
            return;
          }

          request.resolve(
            mapSerialPreviewDrop({
              drop,
              expectedWaveId: request.waveId,
            })
          );
        });
      }
    } catch (error) {
      const rejectRemainingRequests = () => {
        activeRequests.forEach((request) => {
          request.reject(error);
        });
        activeRequests.clear();
      };

      if (isAbortError(error)) {
        rejectRemainingRequests();
        return;
      }

      rejectRemainingRequests();
    } finally {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    }
  }
}

export const serialPreviewBatcher = new SerialPreviewBatcher();

export async function fetchQuorumParticipationDropPreviewBySerialNoV2({
  waveId,
  serialNo,
  signal,
}: FetchQuorumParticipationDropPreviewBySerialNoV2Props): Promise<ApiDrop | null> {
  return serialPreviewBatcher.enqueue({
    waveId,
    serialNo,
    signal,
  });
}
