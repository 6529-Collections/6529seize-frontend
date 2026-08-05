import LatestActivityRow, {
  printGas,
  printRoyalties,
} from "@/components/latest-activity/LatestActivityRow";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import { MANIFOLD } from "@/constants/constants";
import {
  faCartPlus,
  faFire,
  faGasPump,
} from "@fortawesome/free-solid-svg-icons";
import { render } from "@testing-library/react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (p: any) => <img {...p} />,
}));
const iconMock = jest.fn();
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (p: any) => {
    iconMock(p);
    return <svg data-testid="icon" />;
  },
}));
jest.mock("@/components/address/Address", () => (p: any) => (
  <span>{p.display}</span>
));

jest.mock("@/helpers/Helpers", () => ({
  areEqualAddresses: (a: string, b: string) =>
    a.toLowerCase() === b.toLowerCase(),
  areEqualURLS: (a: string, b: string) => a === b,
  displayDecimal: (n: number) => String(n),
  getDateDisplay: () => "now",
  isNextgenContract: () => false,
  isGradientsContract: () => false,
  isMemeLabContract: () => false,
  isMemesContract: () => true,
  isNullAddress: (a: string) => a === "0x0",
  numberWithCommas: (n: number) => String(n),
  getRoyaltyImage: () => "royal.png",
}));

afterEach(() => jest.clearAllMocks());

describe("printRoyalties", () => {
  it("returns empty fragment when value is zero", () => {
    const { container } = render(<>{printRoyalties(0, 1, "0x1")}</>);
    expect(container.firstChild).toBeNull();
  });

  it("renders image with royalty tooltip when applicable", () => {
    const { container } = render(<>{printRoyalties(10, 2, "0x1")}</>);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toHaveAttribute("src", "/royal.png");
    expect(img).toHaveAttribute("alt", "royal.png");
  });
});

const baseTr = {
  contract: "0xcontract",
  from_address: "0xfrom",
  from_display: "From",
  to_address: "0xto",
  to_display: "To",
  token_id: 1,
  token_count: 1,
  value: 0,
  gas: 1,
  gas_gwei: 1,
  gas_price_gwei: 1,
  transaction: "tx",
  transaction_date: "2020-01-01",
  royalties: 0,
} as any;

describe("LatestActivityRow", () => {
  it("applies striped Tailwind row styling", () => {
    const { container } = render(
      <table>
        <tbody>
          <LatestActivityRow tr={baseTr} />
        </tbody>
      </table>
    );

    expect(container.querySelector("tr")).toHaveClass(
      "odd:tw-bg-transparent",
      "even:tw-bg-iron-900/45",
      "hover:tw-bg-iron-900/70"
    );
  });

  it("keeps the date column compact when the NFT image is hidden", () => {
    const { container } = render(
      <table>
        <tbody>
          <LatestActivityRow tr={baseTr} />
        </tbody>
      </table>
    );

    expect(container.querySelector("td")).toHaveClass("tw-w-px");
  });

  it("describes a NextGen transfer from sender to recipient", () => {
    const { container } = render(
      <table>
        <tbody>
          <LatestActivityRow
            tr={{
              ...baseTr,
              contract: NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
            }}
            hideNextgenTokenId
          />
        </tbody>
      </table>
    );

    expect(container).toHaveTextContent("Transferred from From to To");
  });

  it("uses burn icon when to address is null", () => {
    render(
      <table>
        <tbody>
          <LatestActivityRow tr={{ ...baseTr, to_address: "0x0" }} />
        </tbody>
      </table>
    );
    expect(iconMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: faFire,
        className: expect.stringContaining("tw-text-red"),
      })
    );
  });

  it("uses mint icon when from address is MANIFOLD and value > 0", () => {
    render(
      <table>
        <tbody>
          <LatestActivityRow
            tr={{ ...baseTr, from_address: MANIFOLD, value: 1 }}
          />
        </tbody>
      </table>
    );
    expect(iconMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: faCartPlus,
        className: expect.stringContaining("tw-text-iron-100"),
      })
    );
  });

  it("renders gas tooltip", () => {
    render(<>{printGas(1, 2, 3)}</>);
    expect(iconMock).toHaveBeenCalledWith(
      expect.objectContaining({ icon: faGasPump })
    );
  });
});

describe("printGas", () => {
  it("renders gas icon", () => {
    render(<>{printGas(1, 2, 3)}</>);
    expect(iconMock).toHaveBeenCalledWith(
      expect.objectContaining({ icon: faGasPump })
    );
  });
});

describe("extra cases", () => {
  it("renders gas tooltip", () => {
    const { container } = render(
      <>
        {require("@/components/latest-activity/LatestActivityRow").printGas(
          1,
          2,
          3
        )}
      </>
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("returns empty when token count is zero", () => {
    const { container } = render(
      <table>
        <tbody>
          <LatestActivityRow tr={{ ...baseTr, token_count: 0 }} />
        </tbody>
      </table>
    );
    expect(container.querySelector("tr")).toBeNull();
  });
});

test("prints an NFT identity fallback when requested without metadata", () => {
  const { container } = render(
    <table>
      <tbody>
        <LatestActivityRow tr={{ ...baseTr, nft: undefined }} showNftIdentity />
      </tbody>
    </table>
  );
  expect(container.textContent).toContain("The Memes #1");
});
