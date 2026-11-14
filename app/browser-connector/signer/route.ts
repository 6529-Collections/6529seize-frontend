import { NextResponse } from "next/server";
import { getDesktopWalletRequestSigner } from "@/config/desktopWalletEnv";

// Read at request time: the desktop shell sets the signer when it starts
// the local server, long after the build.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * The address 6529 Desktop signs wallet requests with during this run, for
 * the browser connector page to verify a request before showing it. Not
 * found on the web, where no desktop shell runs this server.
 */
export function GET() {
  const signer = getDesktopWalletRequestSigner();
  if (signer === null) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: NO_STORE }
    );
  }
  return NextResponse.json({ signer }, { headers: NO_STORE });
}
