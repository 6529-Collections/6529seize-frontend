import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewConsolidationComponent from "@/components/delegation/NewConsolidation";
import type { DelegationSubmitGroups } from "@/components/delegation/DelegationFormParts";
import { DELEGATION_ABI } from "@/abis/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { CONSOLIDATION_USE_CASE } from "@/components/delegation/delegation-constants";
import type { ComponentProps } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(() => "en-US"),
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg data-testid="icon" />,
}));

const mockSubmitGroups = jest.fn<
  null,
  [ComponentProps<typeof DelegationSubmitGroups>]
>(() => null);

jest.mock("@/components/delegation/DelegationFormParts", () => {
  const actual = jest.requireActual(
    "@/components/delegation/DelegationFormParts"
  );

  return {
    __esModule: true,
    ...actual,
    DelegationCloseButton: (props: any) => (
      <button data-testid="close" onClick={props.onHide}>
        x
      </button>
    ),
    DelegationFormOriginalDelegatorFormGroup: (props: any) => (
      <div data-testid="original">{props.subdelegation.originalDelegator}</div>
    ),
    DelegationAddressDisabledInput: ({ address }: any) => (
      <input data-testid="disabled-address" value={address} readOnly />
    ),
    DelegationFormCollectionFormGroup: ({ collection, setCollection }: any) => (
      <select
        data-testid="collection"
        value={collection}
        onChange={(e) => setCollection(e.target.value)}
      >
        <option value="0">Select</option>
        <option value="1">Col1</option>
      </select>
    ),
    DelegationFormDelegateAddressFormGroup: ({ setAddress, title }: any) => (
      <input
        data-testid="delegate"
        aria-label={title}
        onChange={(e) => setAddress(e.target.value)}
      />
    ),
    DelegationSubmitGroups: (props: any) => mockSubmitGroups(props),
  };
});

const baseProps = {
  address: "0xabc",
  ens: null,
  onHide: jest.fn(),
  onSetToast: jest.fn(),
};

beforeEach(() => {
  mockSubmitGroups.mockClear();
  jest.mocked(useBrowserLocale).mockReturnValue("en-US");
});

describe("NewConsolidationComponent", () => {
  it.each(SUPPORTED_LOCALES)(
    "renders normal instructions with %s fallback",
    (locale) => {
      jest.mocked(useBrowserLocale).mockReturnValue(locale);
      render(<NewConsolidationComponent {...baseProps} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "Register Consolidation"
      );
      expect(screen.queryByTestId("original")).toBeNull();
      expect(
        screen.getByRole("heading", { name: "Two wallets · two registrations" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Register from this wallet, then connect the other wallet and register the return link. Each wallet needs ETH for gas."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "The link is public. Existing profile data may be combined."
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId("collection")).toHaveValue("0");
      expect(screen.getByTestId("delegate")).toHaveValue("");
      expect(
        mockSubmitGroups.mock.calls[0]?.[0].writeParams.functionName
      ).toBeUndefined();
    }
  );

  it("keeps the normal registration contract and arguments", async () => {
    const user = userEvent.setup();
    render(<NewConsolidationComponent {...baseProps} />);

    await user.selectOptions(screen.getByTestId("collection"), "1");
    await user.type(
      screen.getByRole("textbox", { name: "Consolidating With" }),
      "0x1111111111111111111111111111111111111111"
    );

    expect(mockSubmitGroups.mock.calls.at(-1)?.[0].writeParams).toEqual({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "registerDelegationAddress",
      args: [
        "1",
        "0x1111111111111111111111111111111111111111",
        NEVER_DATE,
        CONSOLIDATION_USE_CASE.use_case,
        true,
        0,
      ],
    });
  });

  it("handles subdelegation and passes write params", async () => {
    const user = userEvent.setup();
    const collection = {
      title: "Any",
      display: "Any",
      contract: "0x1",
      preview: "",
    };
    render(
      <NewConsolidationComponent
        {...baseProps}
        subdelegation={{ originalDelegator: "0xdef", collection }}
      />
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Register Consolidation as Delegation Manager"
    );
    expect(screen.getByTestId("original")).toHaveTextContent("0xdef");
    expect(
      screen.queryByRole("heading", { name: "Two wallets · two registrations" })
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByTestId("collection"), "1");
    await user.type(
      screen.getByTestId("delegate"),
      "0x1111111111111111111111111111111111111111"
    );

    expect(mockSubmitGroups.mock.calls.at(-1)?.[0].writeParams).toEqual({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "registerDelegationAddressUsingSubDelegation",
      args: [
        "0xdef",
        "1",
        "0x1111111111111111111111111111111111111111",
        NEVER_DATE,
        CONSOLIDATION_USE_CASE.use_case,
        true,
        0,
      ],
    });
  });
});
