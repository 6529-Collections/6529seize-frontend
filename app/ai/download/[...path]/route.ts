import { resolveAiReleaseDownload } from "@/lib/ai-page/releaseDownload";
import { releaseDownloadResponse } from "@/lib/release-section/download";

/**
 * /ai/download/<file>, or /ai/download/<version>/<file> with the newest
 * release's version. Answers with a 302 to a presigned S3 URL that works
 * for five minutes. Only files the signed feed lists for the newest release
 * can be fetched.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await params;
  return releaseDownloadResponse(await resolveAiReleaseDownload(path), {
    unavailable: "The release list is unavailable. Try again in a minute.\n",
    notFound: "The newest release has no file by that name.\n",
  });
}
