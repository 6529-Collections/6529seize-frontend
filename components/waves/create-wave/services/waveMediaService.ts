import { DropMedia, CreateDropPart, CreateDropRequestPart } from "../../../../entities/IDrop";
import { commonApiPost } from "../../../../services/api/common-api";

/**
 * Generates media for a part by uploading a file
 * @param media File to upload
 * @returns Promise with DropMedia object
 */
export const generateMediaForPart = async (media: File): Promise<DropMedia> => {
  const prep = await commonApiPost<
    {
      content_type: string;
      file_name: string;
      file_size: number;
    },
    {
      upload_url: string;
      content_type: string;
      media_url: string;
    }
  >({
    endpoint: "drop-media/prep",
    body: {
      content_type: media.type,
      file_name: media.name,
      file_size: media.size,
    },
  });
  const myHeaders = new Headers({ "Content-Type": prep.content_type });
  await fetch(prep.upload_url, {
    method: "PUT",
    headers: myHeaders,
    body: media,
  });
  return {
    url: prep.media_url,
    mime_type: prep.content_type,
  };
};

/**
 * Generates media for wave overview by uploading a file
 * @param file File to upload or null
 * @returns Promise with media object or null
 */
export const generateMediaForOverview = async (
  file: File | null
): Promise<{
  readonly url: string;
  readonly mime_type: string;
} | null> => {
  if (!file) return null;
  const prep = await commonApiPost<
    {
      content_type: string;
      file_name: string;
      file_size: number;
    },
    {
      upload_url: string;
      content_type: string;
      media_url: string;
    }
  >({
    endpoint: "wave-media/prep",
    body: {
      content_type: file.type,
      file_name: file.name,
      file_size: file.size,
    },
  });
  const myHeaders = new Headers({ "Content-Type": prep.content_type });
  await fetch(prep.upload_url, {
    method: "PUT",
    headers: myHeaders,
    body: file,
  });
  return {
    url: prep.media_url,
    mime_type: prep.content_type,
  };
};

/**
 * Generates a drop part with uploaded media
 * @param part CreateDropPart to process
 * @returns Promise with CreateDropRequestPart
 */
export const generateDropPart = async (
  part: CreateDropPart
): Promise<CreateDropRequestPart> => {
  const media = await Promise.all(
    part.media.map((media) => generateMediaForPart(media))
  );
  return {
    ...part,
    media,
  };
};