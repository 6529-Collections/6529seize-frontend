import {
  CreateDropPart,
  CreateDropRequestPart,
} from "../../../../entities/IDrop";
import { multiPartUpload } from "./multiPartUpload";

/**
 * Generates a drop part with uploaded media
 * @param part CreateDropPart to process
 * @returns Promise with CreateDropRequestPart
 */
export const generateDropPart = async (
  part: CreateDropPart
): Promise<CreateDropRequestPart> => {
  const media = await Promise.all(
    part.media.map((media) => multiPartUpload({ file: media, path: "drop" }))
  );
  return {
    ...part,
    media,
  };
};
