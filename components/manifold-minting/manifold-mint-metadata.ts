interface ArweaveMetadataDetails {
  bytes?: number;
  format?: string;
  sha256?: string;
  width?: number;
  height?: number;
}

export interface ArweaveAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
}

export interface ArweaveMetadata {
  created_by?: string;
  description?: string;
  name?: string;
  external_url?: string;
  attributes?: ArweaveAttribute[];
  image_details?: ArweaveMetadataDetails;
  image?: string;
  image_url?: string;
  animation_details?: ArweaveMetadataDetails | string;
  animation?: string;
  animation_url?: string;
}

export interface ManifoldMintMetadata {
  tokenId: number;
  metadata: ArweaveMetadata;
}
