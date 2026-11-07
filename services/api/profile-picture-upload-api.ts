import { commonApiPostForm } from "@/services/api/common-api";

const PROFILE_PICTURE_UPLOAD_ENDPOINT = "profiles/pfp/ipfs";

/**
 * Uploads a profile picture through the 6529 API, which checks the image and
 * pins it on IPFS. Resolves to the `ipfs://` URL to save as the profile's
 * `pfp_url`.
 */
export async function uploadProfilePicture(file: File): Promise<string> {
  const body = new FormData();
  body.append("pfp", file);
  const { pfp_url } = await commonApiPostForm<{ pfp_url: string }>({
    endpoint: PROFILE_PICTURE_UPLOAD_ENDPOINT,
    body,
  });
  if (typeof pfp_url !== "string" || !pfp_url.startsWith("ipfs://")) {
    throw new Error("Profile picture upload returned an unexpected URL");
  }
  return pfp_url;
}
