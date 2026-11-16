import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
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
    // A person who opens an old download link reads these in the tab.
    unavailable: `${t(DEFAULT_LOCALE, "desktopPage.downloadRoute.unavailable")}\n`,
    notFound: `${t(DEFAULT_LOCALE, "desktopPage.downloadRoute.notFound")}\n`,
  });
}
