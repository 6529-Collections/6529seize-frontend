import { resolveAiReleaseDownload } from "@/lib/ai-page/releaseDownload";

function plain(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

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
  const result = await resolveAiReleaseDownload(path);
  if (result.state === "unavailable") {
    return plain(
      503,
      "The release list is unavailable. Try again in a minute.\n"
    );
  }
  if (result.state === "not-found") {
    return plain(404, "The newest release has no file by that name.\n");
  }
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: result.url,
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
