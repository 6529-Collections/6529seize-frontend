import { resolveDesktopDownload } from "@/lib/desktop-releases/releaseDownload";
import { releaseDownloadResponse } from "@/lib/release-section/download";

/**
 * /desktop/download/<file>, or /desktop/download/<version>/<file> with the
 * newest release's version. Answers with a 302 to a presigned S3 URL that
 * works for five minutes. Only files the verified release list names for
 * the newest release can be fetched.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await params;
  return releaseDownloadResponse(await resolveDesktopDownload(path), {
    unavailable: "The release list is unavailable. Try again in a minute.\n",
    notFound: "The newest release has no file by that name.\n",
  });
}
