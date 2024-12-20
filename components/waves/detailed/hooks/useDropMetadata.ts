import { useEffect, useMemo, useState } from "react";
import { ApiWaveMetadataType } from "../../../../generated/models/ApiWaveMetadataType";

export type CreateDropMetadataType =
  | {
      key: string;
      readonly type: ApiWaveMetadataType.String;
      value: string | null;
      readonly required: boolean;
    }
  | {
      key: string;
      readonly type: ApiWaveMetadataType.Number;
      value: number | null;
      readonly required: boolean;
    }
  | {
      key: string;
      readonly type: null;
      value: string | null;
      readonly required: boolean;
    };

interface UseDropMetadataProps {
  readonly isDropMode: boolean;
  readonly requiredMetadata: {
    readonly name: string;
    readonly type: ApiWaveMetadataType;
  }[];
}

const isValueSet = (md: CreateDropMetadataType): boolean => {
  if (md.value === null) return false;
  if (typeof md.value === "string") return md.value !== "";
  if (typeof md.value === "number") return true;
  return false;
};

const createInitialDropMetadata = (requiredMetadata: UseDropMetadataProps["requiredMetadata"]) => {
  return requiredMetadata.map((md) => ({
    key: md.name,
    type: md.type,
    value: null,
    required: true,
  }));
};

const createEmptyMetadata = () => {
  return [];
};

const addMissingRequiredMetadata = (
  currentMetadata: CreateDropMetadataType[],
  initialMetadata: CreateDropMetadataType[]
) => {
  const missingMetadata = initialMetadata.filter(
    (initMd) => !currentMetadata.some((md) => md.key === initMd.key)
  );
  return [...currentMetadata, ...missingMetadata];
};

const removeUnsetRequiredMetadata = (metadata: CreateDropMetadataType[]) => {
  return metadata.filter((md) => !md.required || isValueSet(md));
};

export const useDropMetadata = ({ isDropMode, requiredMetadata }: UseDropMetadataProps) => {
  const initialMetadata = useMemo(
    () => isDropMode ? createInitialDropMetadata(requiredMetadata) : createEmptyMetadata(),
    [requiredMetadata, isDropMode]
  );

  const [metadata, setMetadata] = useState<CreateDropMetadataType[]>(initialMetadata);

  useEffect(() => {
    setMetadata((prev) => {
      const updatedMetadata = isDropMode
        ? addMissingRequiredMetadata(prev, initialMetadata)
        : removeUnsetRequiredMetadata(prev);

      return JSON.stringify(updatedMetadata) !== JSON.stringify(prev) 
        ? updatedMetadata 
        : prev;
    });
  }, [isDropMode, initialMetadata]);

  return {
    metadata,
    setMetadata,
    isValueSet,
    initialMetadata,
  };
}; 
