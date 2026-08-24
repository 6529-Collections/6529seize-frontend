import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import {
  createWaveMetadata,
  deleteWaveMetadata,
} from "@/services/api/waves-v2-api";

const rollbackWaveMetadataReplacement = async ({
  waveId,
  createdRows,
  deletedRows,
}: {
  readonly waveId: string;
  readonly createdRows: readonly ApiWaveMetadata[];
  readonly deletedRows: readonly ApiWaveMetadata[];
}): Promise<void> => {
  for (const createdRow of createdRows) {
    try {
      await deleteWaveMetadata({ waveId, metadataId: createdRow.id });
    } catch {
      // Continue the best-effort rollback and preserve the original failure.
    }
  }

  for (const deletedRow of deletedRows.toReversed()) {
    try {
      await createWaveMetadata({
        waveId,
        body: {
          data_key: deletedRow.data_key,
          data_value: deletedRow.data_value,
        },
      });
    } catch {
      // Continue the best-effort rollback and preserve the original failure.
    }
  }
};

export async function replaceWaveMetadata({
  waveId,
  metadata,
  create,
  deleteIds,
}: {
  readonly waveId: string;
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly create: readonly ApiCreateWaveMetadataRequest[];
  readonly deleteIds: readonly number[];
}): Promise<void> {
  const metadataById = new Map(metadata?.map((item) => [item.id, item]));
  const deletedRows: ApiWaveMetadata[] = [];
  const createdRows: ApiWaveMetadata[] = [];

  try {
    for (const metadataId of deleteIds) {
      await deleteWaveMetadata({ waveId, metadataId });
      const deletedRow = metadataById.get(metadataId);
      if (deletedRow) {
        deletedRows.push(deletedRow);
      }
    }

    for (const body of create) {
      createdRows.push(await createWaveMetadata({ waveId, body }));
    }
  } catch (writeError) {
    await rollbackWaveMetadataReplacement({ waveId, createdRows, deletedRows });
    throw writeError;
  }
}
