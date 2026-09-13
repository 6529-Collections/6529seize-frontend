import {
  resolveCollectContractIdentity,
  type CollectContractIdentity,
  type CollectContractRole,
} from "@/components/collect/collect-contract-identity";
import { getAddress } from "viem";

const identities: ReadonlyArray<{
  address: string;
  role: CollectContractRole;
  name: NonNullable<CollectContractIdentity["name"]>;
}> = [
  {
    address: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    role: "nft",
    name: "The Memes",
  },
  {
    address: "0x0c58ef43ff3032005e472cb5709f8908acb00205",
    role: "nft",
    name: "6529 Gradient",
  },
  {
    address: "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
    role: "nft",
    name: "NextGen",
  },
  {
    address: "0x0000000000000068f116a894984e2db1123eb395",
    role: "exchange",
    name: "Seaport 1.6",
  },
  {
    address: "0x0000a26b00c1F0DF003000390027140000fAa719",
    role: "fee",
    name: "OpenSea",
  },
];
const roles: readonly CollectContractRole[] = [
  "nft",
  "exchange",
  "fee",
  "approval",
];

describe("resolveCollectContractIdentity", () => {
  it.each(identities)(
    "identifies $name case-insensitively in its mainnet role",
    ({ address, role, name }) => {
      const expected = {
        name,
        address: getAddress(address),
        explorerUrl: `https://etherscan.io/address/${getAddress(address)}`,
        role,
      };
      for (const input of [
        address.toLowerCase(),
        `0x${address.slice(2).toUpperCase()}`,
        getAddress(address),
      ]) {
        expect(resolveCollectContractIdentity(1, input, role)).toEqual(
          expected
        );
      }
    }
  );

  it.each(identities)(
    "does not brand $name when used in another role",
    ({ address, role: knownRole }) => {
      for (const role of roles.filter((value) => value !== knownRole)) {
        expect(resolveCollectContractIdentity(1, address, role)).toEqual({
          name: null,
          address: getAddress(address),
          explorerUrl: `https://etherscan.io/address/${getAddress(address)}`,
          role,
        });
      }
    }
  );

  it.each([undefined, 0, -1, 1.5, 137, 11155111, Number.NaN, Infinity])(
    "withholds names and mainnet links for chain %s",
    (chainId) => {
      for (const { address, role } of identities) {
        expect(resolveCollectContractIdentity(chainId, address, role)).toEqual({
          name: null,
          address: getAddress(address),
          explorerUrl: null,
          role,
        });
      }
    }
  );

  it("does not coerce a runtime string chain ID to mainnet", () => {
    const address = "0x0000000000000068f116a894984e2db1123eb395";
    expect(
      resolveCollectContractIdentity(
        "1" as unknown as number,
        address,
        "exchange"
      )
    ).toEqual({
      name: null,
      address: getAddress(address),
      explorerUrl: null,
      role: "exchange",
    });
  });

  it.each(roles)("keeps an unknown address unbranded in role %s", (role) => {
    const address = "0x52908400098527886e0f7030069857d2e4169ee7";
    const checksum = "0x52908400098527886E0F7030069857D2E4169EE7";
    expect(resolveCollectContractIdentity(1, address, role)).toEqual({
      name: null,
      address: checksum,
      explorerUrl: `https://etherscan.io/address/${checksum}`,
      role,
    });
  });

  it("normalizes mixed casing without treating it as a separate identity", () => {
    const address = "0x52908400098527886e0F7030069857d2e4169ee7";
    expect(resolveCollectContractIdentity(1, address, "nft").address).toBe(
      "0x52908400098527886E0F7030069857D2E4169EE7"
    );
  });

  it.each(identities)(
    "requires the exact $name address",
    ({ address, role }) => {
      const differentAddress = `${address.slice(0, -1)}${address.endsWith("0") ? "1" : "0"}`;
      expect(
        resolveCollectContractIdentity(1, differentAddress, role).name
      ).toBeNull();
    }
  );

  it.each([
    "",
    "OpenSea",
    "memes.eth",
    "0x33fd",
    "33fd426905f149f8376e227d0c9d3340aad17af1",
    "0X33fd426905f149f8376e227d0c9d3340aad17af1",
    "0x33fd426905f149f8376e227d0c9d3340aad17af",
    "0x33fd426905f149f8376e227d0c9d3340aad17af10",
    "0x33fd426905f149f8376e227d0c9d3340aad17afg",
    " 0x33fd426905f149f8376e227d0c9d3340aad17af1",
    "0x33fd426905f149f8376e227d0c9d3340aad17af1 ",
    "https://etherscan.io/address/0x33fd426905f149f8376e227d0c9d3340aad17af1",
    "0x33fd426905f149f8376e227d0c9d3340aad17af1?label=OpenSea",
  ])(
    "preserves invalid input without a trusted name or link: %s",
    (address) => {
      for (const role of roles) {
        expect(resolveCollectContractIdentity(1, address, role)).toEqual({
          name: null,
          address,
          explorerUrl: null,
          role,
        });
      }
    }
  );
});
