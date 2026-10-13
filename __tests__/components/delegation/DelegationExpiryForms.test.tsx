import NewDelegation from "@/components/delegation/NewDelegation";
import UpdateDelegationComponent from "@/components/delegation/UpdateDelegation";
import type { DelegationExpirySelection } from "@/components/delegation/delegation-expiry";
import type { DelegationWriteParams } from "@/components/delegation/delegation-shared";
import { NEVER_DATE } from "@/constants/constants";
import { fireEvent, render, screen } from "@testing-library/react";

const NOW_MS = Date.parse("2026-10-14T19:00:00Z");
const NOW_SECONDS = NOW_MS / 1000;
const TOO_SOON_ERROR =
  "Choose a later expiry date. The delegation must stay active for at least 1 hour after you submit.";
const DELEGATE = "0x2222222222222222222222222222222222222222";

type FormValidate = (submittedAtMs?: number) => string[];

const submitProps: {
  current?: {
    writeParams: DelegationWriteParams;
    validate: FormValidate;
  };
} = {};

jest.mock("wagmi", () => ({
  useEnsName: () => ({ data: null }),
  useEnsAddress: () => ({ data: null }),
}));

jest.mock("@/hooks/useEnsResolution", () => {
  const { useState } = jest.requireActual<typeof import("react")>("react");
  return {
    useEnsResolution: () => {
      const [address, setAddress] = useState("");
      return {
        inputValue: address,
        address,
        handleInputChange: setAddress,
      };
    },
  };
});

jest.mock("@/components/delegation/DelegationFormParts", () => {
  const actual = jest.requireActual(
    "@/components/delegation/DelegationFormParts"
  );

  return {
    ...actual,
    DelegationAddressDisabledInput: () => <div />,
    DelegationFormCollectionFormGroup: () => <div />,
    DelegationFormDelegateAddressFormGroup: ({
      setAddress,
    }: {
      setAddress: (address: string) => void;
    }) => (
      <button type="button" onClick={() => setAddress(DELEGATE)}>
        set delegate
      </button>
    ),
    DelegationExpiryCalendar: ({
      onChange,
    }: {
      onChange: (value: DelegationExpirySelection) => void;
    }) => (
      <>
        <button
          type="button"
          onClick={() =>
            onChange({ date: "2026-10-14", expiresAt: NOW_SECONDS + 3600 })
          }
        >
          pick too soon
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({ date: "2026-10-14", expiresAt: NOW_SECONDS + 3601 })
          }
        >
          pick valid
        </button>
      </>
    ),
    DelegationSubmitGroups: (props: {
      writeParams: DelegationWriteParams;
      validate: FormValidate;
    }) => {
      submitProps.current = props;
      return null;
    },
  };
});

function latestSubmit() {
  if (!submitProps.current) {
    throw new Error("DelegationSubmitGroups was not rendered");
  }
  return submitProps.current;
}

describe("delegation expiry submit validation", () => {
  beforeEach(() => {
    delete submitProps.current;
  });

  it("refuses a new delegation that would expire within the lead time", () => {
    render(
      <NewDelegation
        address="0x1111111111111111111111111111111111111111"
        ens={null}
        collection_query="0x33FD426905F149f8376e227d0C9D3340AaD17aF1"
        use_case_query={1}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "set delegate" }));
    expect(latestSubmit().validate(NOW_MS)).toEqual([]);
    expect(latestSubmit().writeParams.args[2]).toBe(NEVER_DATE);

    fireEvent.click(screen.getByRole("radio", { name: "Select Date" }));
    expect(latestSubmit().validate(NOW_MS)).toEqual([
      "Missing or invalid Expiry",
    ]);
    expect(latestSubmit().writeParams.functionName).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "pick too soon" }));
    expect(latestSubmit().validate(NOW_MS)).toEqual([TOO_SOON_ERROR]);
    // Render-time gating checks presence only and never reads the clock;
    // the submit handler passes the click time, which blocks the write.
    expect(latestSubmit().validate()).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "pick valid" }));
    expect(latestSubmit().validate(NOW_MS)).toEqual([]);
    expect(latestSubmit().writeParams.functionName).toBe(
      "registerDelegationAddress"
    );
    expect(latestSubmit().writeParams.args[2]).toBe(NOW_SECONDS + 3601);

    // A form left open is checked against the time of the submit click.
    expect(latestSubmit().validate(NOW_MS + 2000)).toEqual([TOO_SOON_ERROR]);
  });

  it("sends the selected expiry on a manager-registered delegation", () => {
    render(
      <NewDelegation
        address="0x1111111111111111111111111111111111111111"
        ens={null}
        collection_query="0x33FD426905F149f8376e227d0C9D3340AaD17aF1"
        use_case_query={1}
        subdelegation={{
          originalDelegator: "0x3333333333333333333333333333333333333333",
          collection: {
            title: "The Memes",
            display: "The Memes",
            contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
            preview: "",
          },
        }}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "set delegate" }));
    fireEvent.click(screen.getByRole("radio", { name: "Select Date" }));
    fireEvent.click(screen.getByRole("button", { name: "pick valid" }));

    expect(latestSubmit().writeParams.functionName).toBe(
      "registerDelegationAddressUsingSubDelegation"
    );
    expect(latestSubmit().writeParams.args[3]).toBe(NOW_SECONDS + 3601);
  });

  it("refuses an update that would replace a delegation with an expired one", () => {
    render(
      <UpdateDelegationComponent
        address="0x1111111111111111111111111111111111111111"
        delegation={{ wallet: DELEGATE, use_case: 1, display: "All" }}
        ens={null}
        collection={{
          title: "The Memes",
          display: "The Memes",
          contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
          preview: "",
        }}
        showCancel={false}
        showAddMore={false}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText("New Delegate Address"), {
      target: { value: "0x4444444444444444444444444444444444444444" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Select Date" }));

    fireEvent.click(screen.getByRole("button", { name: "pick too soon" }));
    expect(latestSubmit().validate(NOW_MS)).toEqual([TOO_SOON_ERROR]);

    fireEvent.click(screen.getByRole("button", { name: "pick valid" }));
    expect(latestSubmit().validate(NOW_MS)).toEqual([]);
    expect(latestSubmit().writeParams.functionName).toBe(
      "updateDelegationAddress"
    );
    expect(latestSubmit().writeParams.args[3]).toBe(NOW_SECONDS + 3601);
  });
});
