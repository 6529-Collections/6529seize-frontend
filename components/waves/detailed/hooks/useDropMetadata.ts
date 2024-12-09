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

export const useDropMetadata = ({ isDropMode, requiredMetadata }: UseDropMetadataProps) => {
  const initialMetadata = useMemo(() => {
    return isDropMode
      ? requiredMetadata.map((md) => ({
          key: md.name,
          type: md.type,
          value: null,
          required: true,
        }))
      : [];
  }, [requiredMetadata, isDropMode]);

  const [metadata, setMetadata] = useState<CreateDropMetadataType[]>(initialMetadata);

  useEffect(() => {
    if (isDropMode) {
      // Add missing required metadata from initialMetadata
      const missingMetadata = initialMetadata.filter(
        (initMd) => !metadata.some((md) => md.key === initMd.key)
      );
      if (missingMetadata.length > 0) {
        setMetadata((prev) => [...prev, ...missingMetadata]);
      }
    } else {
      // Remove required metadata that has no value set
      setMetadata((prev) =>
        prev.filter((md) => !md.required || isValueSet(md))
      );
    }
  }, [isDropMode, initialMetadata, metadata]);

  return {
    metadata,
    setMetadata,
    isValueSet,
    initialMetadata,
  };
}; 
