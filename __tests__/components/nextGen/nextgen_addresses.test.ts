import fs from "node:fs";
import path from "node:path";
import {
  NEXTGEN_ADMIN_ADDRESSES,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE_ADDRESSES,
  NEXTGEN_MINTER_ADDRESSES,
} from "@/components/nextGen/nextgen_addresses";
import {
  NEXTGEN_ADMIN,
  NEXTGEN_CHAIN_ID as CONTRACTS_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "@/components/nextGen/nextgen_contracts";
import {
  NEXTGEN_ADMIN_ABI,
  NEXTGEN_CORE_ABI,
  NEXTGEN_MINTER_ABI,
} from "@/abis/abis";

describe("nextgen_addresses", () => {
  it("gives the contracts module the same addresses plus their ABIs", () => {
    expect(CONTRACTS_CHAIN_ID).toBe(NEXTGEN_CHAIN_ID);
    expect(NEXTGEN_CORE).toEqual({
      ...NEXTGEN_CORE_ADDRESSES,
      abi: NEXTGEN_CORE_ABI,
    });
    expect(NEXTGEN_MINTER).toEqual({
      ...NEXTGEN_MINTER_ADDRESSES,
      abi: NEXTGEN_MINTER_ABI,
    });
    expect(NEXTGEN_ADMIN).toEqual({
      ...NEXTGEN_ADMIN_ADDRESSES,
      abi: NEXTGEN_ADMIN_ABI,
    });
  });

  it("stays free of ABIs so address-only code does not bundle them", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "components/nextGen/nextgen_addresses.ts"),
      "utf8"
    );

    expect(source).not.toMatch(/from ["']@\/abis\//);
    expect(source).not.toMatch(/from ["'][^"']*nextgen_contracts/);
  });
});
