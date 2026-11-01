/** @jest-environment node */
import {
  DEFAULT_ROYALTY_RATE,
  FEDERATED_FEE_SHARE,
} from "@/lib/stream/constants";
import type { TxResult } from "@/lib/stream/dataSource";
import { parseEthToWei } from "@/lib/stream/eth";
import {
  deployGas,
  deployGasEstimate,
  GAS_ESTIMATES,
  GLAMSTERDAM_PRICES,
} from "@/lib/stream/gas";
import { createMockStream, MOCK_ACCOUNTS } from "@/lib/stream/mock";
import type { Address } from "@/lib/stream/types";

const A = MOCK_ACCOUNTS.collectorA;
const B = MOCK_ACCOUNTS.collectorB;
const DAY = 86_400;

function world() {
  return createMockStream({ wallNow: () => 0 });
}

function expectOk<T>(result: TxResult<T>): T {
  if (!result.ok) {
    throw new Error(`tx failed: ${result.error.code}`);
  }
  return result.value;
}

function eth(text: string): bigint {
  const wei = parseEthToWei(text);
  if (wei === null) {
    throw new Error(text);
  }
  return wei;
}

describe("the federation factory read", () => {
  it("names the factory, the registry and one template per standard", async () => {
    const stream = world();
    const factory = await stream.dataSource.federationFactory();
    const { contracts } = stream.dataSource.source();
    expect(factory.factory).toBe(contracts.federationFactory);
    expect(factory.registry).toBe(contracts.federationRegistry);
    expect(factory.templates.map((entry) => entry.standard)).toEqual([
      "ERC721",
      "ERC1155",
    ]);
    expect(factory.feeShare).toBe(FEDERATED_FEE_SHARE);
    expect(factory.royaltyRate).toBe(DEFAULT_ROYALTY_RATE);
  });

  it("prices a deploy with Sepolia's Glamsterdam state costs", async () => {
    const stream = world();
    const { templates } = await stream.dataSource.federationFactory();
    const [erc721, erc1155] = templates;
    const gas = deployGas(erc721?.codeBytes ?? 0, erc721?.newSlots ?? 0);
    expect(gas.code).toBe((erc721?.codeBytes ?? 0) * 1_542);
    expect(gas.slots).toBe((erc721?.newSlots ?? 0) * 111_000);
    expect(gas.create).toBe(GLAMSTERDAM_PRICES.create);
    expect(gas.total).toBe(33_557_004);
    const pair = deployGasEstimate([
      gas,
      deployGas(erc1155?.codeBytes ?? 0, erc1155?.newSlots ?? 0),
    ]);
    expect(pair).toEqual(GAS_ESTIMATES.federatedDeployPair);
    expect(pair.source).toBe("glamsterdamEstimate");
  });

  it("labels each deploy transaction with its form's estimate", async () => {
    const stream = world();
    const result = await stream.actions.deployFederated(A, {
      form: "ERC1155",
      name: "Gas Check",
      symbol: "GAS",
      defaultLicense: "CC0-1.0",
    });
    expect(result.ok && result.gas).toEqual(GAS_ESTIMATES.federatedDeploy1155);
  });
});

describe("the federated registry entry", () => {
  it("records the owner, factory, royalty and admitted sale methods", async () => {
    const stream = world();
    const deployed = expectOk(
      await stream.actions.deployFederated(A, {
        form: "PAIR",
        name: "Field Notes",
        symbol: "FIELD",
        editionName: "Field Notes Editions",
        editionSymbol: "FIELDE",
        defaultLicense: "CC-BY-4.0",
      })
    );
    const [oneOfOnes, editions] = await Promise.all(
      deployed.contracts.map((address) =>
        stream.dataSource.getFederatedContract(address)
      )
    );
    expect(oneOfOnes?.owner).toBe(A);
    expect(oneOfOnes?.factory).toBe(
      stream.dataSource.source().contracts.federationFactory
    );
    expect(oneOfOnes?.royaltyRate).toBe(DEFAULT_ROYALTY_RATE);
    expect(oneOfOnes?.volume).toBe(0n);
    expect(oneOfOnes?.saleKinds).toEqual(["ENGLISH_AUCTION"]);
    expect(editions?.saleKinds).toEqual(["UNIFORM_AUCTION"]);
    expect(oneOfOnes?.status).toBe("ACTIVE");
  });

  it("counts settled primary sales as volume", async () => {
    const stream = world();
    const [address] = expectOk(
      await stream.actions.deployFederated(A, {
        form: "ERC721",
        name: "Volume Check",
        symbol: "VOL",
        defaultLicense: "CC0-1.0",
      })
    ).contracts;
    const contract = address ?? A;
    const work = expectOk(
      await stream.actions.mintViaAuction(A, contract, "Sold Once")
    );
    const auction = await stream.dataSource.auctionForWork(work);
    const saleId = auction?.saleId ?? "";
    expectOk(
      await stream.actions.sale("ENGLISH_AUCTION").bid(B, saleId, eth("0.3"))
    );
    stream.dev.advance(DAY + 60);
    expectOk(await stream.actions.sale("ENGLISH_AUCTION").settle(B, saleId));
    expect(
      (await stream.dataSource.getFederatedContract(contract))?.volume
    ).toBe(eth("0.3"));
  });
});

describe("the federated directory", () => {
  it("filters by status, counting a delisted artist identity as delisted", async () => {
    const stream = world();
    const active = await stream.dataSource.federatedDirectory({
      status: "ACTIVE",
    });
    const delisted = await stream.dataSource.federatedDirectory({
      status: "DELISTED",
    });
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((entry) => entry.status === "ACTIVE")).toBe(true);
    expect(delisted.map((entry) => entry.name)).toEqual(["Mara Vell Official"]);
    expect(delisted[0]?.delisting?.reason).toBe("impersonation");
    const all = await stream.dataSource.federatedDirectory({
      includeDelisted: true,
    });
    expect(all).toHaveLength(active.length + delisted.length);
  });

  it("filters by form and search", async () => {
    const stream = world();
    const pairs = await stream.dataSource.federatedDirectory({ form: "PAIR" });
    expect(pairs.length).toBeGreaterThanOrEqual(2);
    expect(pairs.every((entry) => entry.form === "PAIR")).toBe(true);
    const found = await stream.dataSource.federatedDirectory({
      search: "reik",
    });
    expect(found.map((entry) => entry.symbol)).toEqual(["REIK"]);
  });
});

describe("a standalone federated edition auction (provisional close)", () => {
  it("closes a fixed 24 hours after opening, before any soft close", async () => {
    const stream = world();
    const artist = "0x00000000000000000000000000000000000000f5" as Address;
    const [contract] = expectOk(
      await stream.actions.deployFederated(artist, {
        form: "ERC1155",
        name: "Standalone",
        symbol: "SOLO",
        defaultLicense: "CC0-1.0",
      })
    ).contracts;
    const edition = expectOk(
      await stream.actions.openFederatedEditionAuction(
        artist,
        contract ?? A,
        "Solo Run",
        0
      )
    );
    const auction = await stream.dataSource.getEditionAuction(edition);
    expect(auction?.master).toBeNull();
    expect(auction?.times.baseEnd).toBe((auction?.times.openedAt ?? 0) + DAY);
    expect(auction?.terms.softWindow).toBe(5 * 60);
  });
});
