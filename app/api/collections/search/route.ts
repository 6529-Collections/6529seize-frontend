import { NextRequest, NextResponse } from "next/server";

// Maps a simple chain slug to the Alchemy REST base. Extend as needed.
const ALCHEMY_CHAIN_BASE: Record<string, string> = {
  "eth-mainnet": "https://eth-mainnet.g.alchemy.com/nft/v3",
};

const CONTRACT_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

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

    const query = q.trim();
    const isAddressQuery = CONTRACT_ADDRESS_REGEX.test(query);
    const contractsMap = new Map<string, any>();

    if (isAddressQuery) {
      const directUrl = `${base}/${apiKey}/getContractMetadata?contractAddress=${query}`;
      const directRes = await fetch(directUrl, { next: { revalidate: 60 } });
      if (directRes.ok) {
        const directData = await directRes.json();
        const directContract = mapAlchemyContract(
          directData?.contract ?? directData?.contractMetadata ?? directData ?? null,
        );
        if (directContract) {
          contractsMap.set(directContract.address.toLowerCase(), directContract);
        }
      } else if (directRes.status >= 400 && directRes.status < 500) {
        // 4xx from direct lookup just means not found; we still try fuzzy search next.
      } else if (!directRes.ok) {
        const body = await directRes.text();
        return NextResponse.json({ error: "Alchemy error", details: body }, { status: directRes.status });
      }
    }

    const searchUrl = `${base}/${apiKey}/searchContractMetadata?query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, { next: { revalidate: 30 } });
    if (!searchRes.ok) {
      if (contractsMap.size > 0 && searchRes.status >= 400 && searchRes.status < 500) {
        // We already have a direct match; tolerate fuzzy errors for keyword-only endpoints.
        return NextResponse.json({ contracts: Array.from(contractsMap.values()) });
      }
      const body = await searchRes.text();
      return NextResponse.json({ error: "Alchemy error", details: body }, { status: searchRes.status });
    }
    const searchData = await searchRes.json();
    const fromSearch = Array.isArray(searchData?.contracts) ? searchData.contracts : [];
    for (const contract of fromSearch) {
      const mapped = mapAlchemyContract(contract);
      if (!mapped) continue;
      const key = mapped.address.toLowerCase();
      if (!contractsMap.has(key)) {
        contractsMap.set(key, mapped);
      }
    }

    return NextResponse.json({ contracts: Array.from(contractsMap.values()) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

function mapAlchemyContract(contract: any): any | null {
  if (!contract) return null;
  const address =
    contract?.address ||
    contract?.contractAddress ||
    contract?.contract?.address ||
    contract?.contract?.contractAddress ||
    contract?.contractMetadata?.address ||
    contract?.contractMetadata?.contractAddress ||
    contract?.contractMetadata?.contractDeployer?.contractAddresses?.[0] ||
    contract?.contractMetadata?.contractDeployer?.address ||
    contract?.contractDeployer?.contractAddresses?.[0] ||
    contract?.contractDeployer?.address;
  if (!address) return null;

  const openSeaMetadata =
    contract?.openSeaMetadata ||
    contract?.contract?.openSeaMetadata ||
    contract?.contractMetadata?.openSeaMetadata ||
    null;

  const spamInfo = contract?.spamInfo ?? null;
  const name =
    spamInfo?.name ||
    contract?.name ||
    openSeaMetadata?.collectionName ||
    contract?.contractMetadata?.name ||
    contract?.contract?.name ||
    address;

  const tokenType =
    contract?.tokenType ||
    contract?.contract?.tokenType ||
    contract?.contractMetadata?.tokenType ||
    null;

  const contractDeployer = contract?.contractDeployer ?? null;

  return {
    address,
    name,
    tokenType,
    openSeaMetadata,
    spamInfo,
    contractDeployer,
  };
}
