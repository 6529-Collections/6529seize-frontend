import { NextRequest, NextResponse } from "next/server";

// Maps a simple chain slug to the Alchemy REST base. Extend as needed.
const ALCHEMY_CHAIN_BASE: Record<string, string> = {
  "eth-mainnet": "https://eth-mainnet.g.alchemy.com/nft/v3",
};

function getAlchemyKey(chain: string): string | undefined {
  // Try chain-specific env first, then fallback
  // Example: ALCHEMY_API_KEY_ETH_MAINNET or ALCHEMY_API_KEY
  if (chain === "eth-mainnet") {
    return process.env.ALCHEMY_API_KEY_ETH_MAINNET || process.env.ALCHEMY_API_KEY;
  }
  return process.env.ALCHEMY_API_KEY;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const chain = searchParams.get("chain") || "eth-mainnet";

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ error: "Query 'q' must be at least 2 chars" }, { status: 400 });
    }

    const base = ALCHEMY_CHAIN_BASE[chain];
    const apiKey = getAlchemyKey(chain);
    if (!base || !apiKey) {
      return NextResponse.json(
        { error: "Alchemy not configured for this chain", chain },
        { status: 501 }
      );
    }

    const url = `${base}/${apiKey}/searchContractMetadata?query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: "Alchemy error", details: body }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
