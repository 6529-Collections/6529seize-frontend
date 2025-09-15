import { NextRequest, NextResponse } from "next/server";

const ALCHEMY_CHAIN_BASE: Record<string, string> = {
  "eth-mainnet": "https://eth-mainnet.g.alchemy.com/nft/v3",
};

function getAlchemyKey(chain: string): string | undefined {
  if (chain === "eth-mainnet") {
    return process.env.ALCHEMY_API_KEY_ETH_MAINNET || process.env.ALCHEMY_API_KEY;
  }
  return process.env.ALCHEMY_API_KEY;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contract: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const chain = searchParams.get("chain") || "eth-mainnet";
    const { contract } = await params;

    if (!contract) {
      return NextResponse.json({ error: "Missing contract" }, { status: 400 });
    }
    const base = ALCHEMY_CHAIN_BASE[chain];
    const apiKey = getAlchemyKey(chain);
    if (!base || !apiKey) {
      return NextResponse.json(
        { error: "Alchemy not configured for this chain", chain },
        { status: 501 }
      );
    }

    const url = `${base}/${apiKey}/getContractMetadata?contractAddress=${contract}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
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
