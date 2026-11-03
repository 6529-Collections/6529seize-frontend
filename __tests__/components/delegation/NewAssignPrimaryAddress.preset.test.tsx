import { AuthContext } from "@/components/auth/Auth";
import NewAssignPrimaryAddress from "@/components/delegation/NewAssignPrimaryAddress";
import type { DelegationWriteParams } from "@/components/delegation/delegation-shared";
import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ContextType } from "react";

const FIRST = "0x1111111111111111111111111111111111111111";
const SECOND = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

const submitProps: { current?: { writeParams: DelegationWriteParams } } = {};

jest.mock("@tanstack/react-query");
jest.mock("wagmi", () => ({
  useEnsName: () => ({ data: null }),
  useEnsAddress: () => ({ data: undefined, isLoading: false }),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));
jest.mock("@/components/delegation/DelegationFormParts", () => {
  const actual = jest.requireActual(
    "@/components/delegation/DelegationFormParts"
  );
  return {
    ...actual,
    DelegationSubmitGroups: (props: { writeParams: DelegationWriteParams }) => {
      submitProps.current = props;
      return null;
    },
  };
});

function renderWithQuery(query: string) {
  jest.mocked(useQuery).mockReturnValue({
    isFetching: false,
    data: { consolidation_key: `${FIRST}-${SECOND}`, address: FIRST, ens: "" },
  } as ReturnType<typeof useQuery>);
  const auth = {
    connectedProfile: { primary_wallet: FIRST },
    fetchingProfile: false,
  } as unknown as ContextType<typeof AuthContext>;
  render(
    <AuthContext.Provider value={auth}>
      <NewAssignPrimaryAddress
        address={FIRST}
        ens={null}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
        new_primary_address_query={query}
        setNewPrimaryAddressQuery={jest.fn()}
      />
    </AuthContext.Provider>
  );
}

describe("NewAssignPrimaryAddress address preset", () => {
  beforeEach(() => {
    delete submitProps.current;
  });

  it("selects the listed address when the link uses different letter case", () => {
    renderWithQuery(SECOND.toUpperCase().replace("0X", "0x"));

    const select = screen.getByRole("combobox", { name: "Primary Address" });
    expect(select).toHaveValue(SECOND);
    expect(submitProps.current?.writeParams.args[1]).toBe(SECOND);
  });

  it("selects nothing for an address outside the consolidation", () => {
    renderWithQuery("0x2222222222222222222222222222222222222222");

    const select = screen.getByRole("combobox", { name: "Primary Address" });
    expect(select).toHaveValue("");
    expect(submitProps.current?.writeParams.functionName).toBeUndefined();
  });
});
