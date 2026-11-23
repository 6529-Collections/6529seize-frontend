import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";

export type HomeDropSelection =
  | { readonly kind: "latest"; readonly nft: ApiMemesExtendedData }
  | {
      readonly kind: "next";
      readonly mintNumber: number;
      readonly drop: ApiDropV2View;
    };
