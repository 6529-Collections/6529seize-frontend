import NewDelegation from "@/components/delegation/NewDelegation";
import {
  GRADIENTS_COLLECTION,
  MEMES_COLLECTION,
} from "@/components/delegation/delegation-constants";
import {
  formatDelegationExpiryLocal,
  getViewerTimeZone,
} from "@/components/delegation/delegation-expiry";
import { parseDelegationFormPresets } from "@/components/delegation/delegation-options";
import type { DelegationWriteParams } from "@/components/delegation/delegation-shared";
import { MEMES_CONTRACT, NEVER_DATE } from "@/constants/constants";
import { fireEvent, render, screen, within } from "@testing-library/react";

const DELEGATOR = "0x1111111111111111111111111111111111111111";
const DELEGATE = "0x2222222222222222222222222222222222222222";
const ORIGINAL_DELEGATOR = "0x3333333333333333333333333333333333333333";

type FormValidate = (submittedAtMs?: number) => string[];

const submitProps: {
  current?: { writeParams: DelegationWriteParams; validate: FormValidate };
} = {};

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

function renderForm(
  query: { collection?: string; use_case?: string },
  extraProps: Partial<Parameters<typeof NewDelegation>[0]> = {}
) {
  // Same parser the Safe Collecting pages run on the link's search params.
  const { collectionQuery, useCaseQuery } = parseDelegationFormPresets(query);
  return render(
    <NewDelegation
      address={DELEGATOR}
      ens={null}
      collection_query={collectionQuery}
      use_case_query={useCaseQuery}
      onHide={jest.fn()}
      onSetToast={jest.fn()}
      {...extraProps}
    />
  );
}

function selectedOptionText(name: string) {
  const select = screen.getByRole("combobox", { name });
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`${name} is not a select`);
  }
  return select.selectedOptions[0]?.textContent;
}

function enterDelegate(address: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Delegate Address" }), {
    target: { value: address },
  });
}

function summary() {
  return screen.getByRole("region", { name: "Review before signing" });
}

describe("NewDelegation link presets", () => {
  beforeEach(() => {
    delete submitProps.current;
  });

  it("pre-selects The Memes contract from the MEMES link", () => {
    renderForm({ collection: "MEMES", use_case: "3" });

    expect(screen.getByRole("combobox", { name: "Collection" })).toHaveValue(
      MEMES_CONTRACT
    );
    expect(selectedOptionText("Collection")).toBe(MEMES_COLLECTION.display);
    expect(screen.getByRole("combobox", { name: "Use Case" })).toHaveValue("3");
    expect(selectedOptionText("Use Case")).toBe("#3 - Airdrops");

    enterDelegate(DELEGATE);
    expect(latestSubmit().validate()).toEqual([]);
    expect(latestSubmit().writeParams.functionName).toBe(
      "registerDelegationAddress"
    );
    expect(latestSubmit().writeParams.args.slice(0, 4)).toEqual([
      MEMES_CONTRACT,
      DELEGATE,
      NEVER_DATE,
      3,
    ]);
  });

  it.each([
    { collection: MEMES_CONTRACT, use_case: "998" },
    { collection: MEMES_CONTRACT, use_case: "999" },
    { collection: MEMES_CONTRACT, use_case: "0" },
    { collection: MEMES_CONTRACT, use_case: "-1" },
    { collection: MEMES_CONTRACT, use_case: "two" },
  ])("leaves the use case unselected for %j", (query) => {
    renderForm(query);
    enterDelegate(DELEGATE);

    expect(screen.getByRole("combobox", { name: "Use Case" })).toHaveValue("0");
    expect(selectedOptionText("Use Case")).toBe("Select Use Case");
    expect(latestSubmit().validate()).toEqual(["Missing or invalid Use Case"]);
    expect(latestSubmit().writeParams.functionName).toBeUndefined();
  });

  it("leaves an unknown collection unselected", () => {
    renderForm({
      collection: "0x4444444444444444444444444444444444444444",
      use_case: "2",
    });
    enterDelegate(DELEGATE);

    expect(screen.getByRole("combobox", { name: "Collection" })).toHaveValue(
      "0"
    );
    expect(selectedOptionText("Collection")).toBe("Select Collection");
    expect(latestSubmit().validate()).toEqual([
      "Missing or invalid Collection",
    ]);
    expect(latestSubmit().writeParams.functionName).toBeUndefined();
  });
});

describe("NewDelegation validation", () => {
  beforeEach(() => {
    delete submitProps.current;
  });

  it("rejects a seeded use case or collection that is not a listed option", () => {
    render(
      <NewDelegation
        address={DELEGATOR}
        ens={null}
        collection_query="MEMES"
        use_case_query={999}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    enterDelegate(DELEGATE);

    expect(latestSubmit().validate()).toEqual([
      "Missing or invalid Collection",
      "Missing or invalid Use Case",
    ]);
    expect(latestSubmit().writeParams.functionName).toBeUndefined();
  });

  it("rejects a collection outside a delegation manager's collection", () => {
    render(
      <NewDelegation
        address={DELEGATOR}
        ens={null}
        subdelegation={{
          originalDelegator: ORIGINAL_DELEGATOR,
          collection: GRADIENTS_COLLECTION,
        }}
        collection_query={MEMES_CONTRACT}
        use_case_query={1}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    enterDelegate(DELEGATE);

    expect(latestSubmit().validate()).toEqual([
      "Missing or invalid Collection",
    ]);
  });
});

describe("NewDelegation signing summary", () => {
  beforeEach(() => {
    delete submitProps.current;
  });

  function summaryValues() {
    return within(summary())
      .getAllByRole("definition")
      .map((value) => value.textContent);
  }

  it("shows known values and marks missing ones while the form is partial", () => {
    renderForm({ collection: "MEMES", use_case: "3" });

    expect(summaryValues()).toEqual([
      `The Memes${MEMES_CONTRACT}`,
      "#3 - Airdrops",
      "Not set",
      "Never",
      "All tokens",
    ]);
    expect(latestSubmit().writeParams.functionName).toBeUndefined();

    fireEvent.click(screen.getByRole("radio", { name: "Select Date" }));
    fireEvent.click(screen.getByRole("radio", { name: "Select Token ID" }));
    expect(summaryValues().slice(3)).toEqual(["Not set", "Not set"]);
    expect(latestSubmit().writeParams.functionName).toBeUndefined();
  });

  it("marks every field as not set on an empty form", () => {
    renderForm({});

    expect(summaryValues()).toEqual([
      "Not set",
      "Not set",
      "Not set",
      "Never",
      "All tokens",
    ]);
    expect(latestSubmit().validate()).toEqual([
      "Missing or invalid Collection",
      "Missing or invalid Use Case",
      "Missing or invalid Address",
    ]);
  });

  it("shows exactly the values passed to the write", () => {
    renderForm({ collection: "MEMES", use_case: "3" });
    enterDelegate(DELEGATE);

    // NEVER_DATE and "all tokens" come from the form's own defaults: only
    // the submit button is mocked here.
    expect(screen.getByRole("radio", { name: "Never" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).toBeChecked();

    const [collection, delegate, expiry, useCase, allTokens, tokenId] =
      latestSubmit().writeParams.args;
    expect([collection, delegate, expiry, useCase, allTokens, tokenId]).toEqual(
      [MEMES_CONTRACT, DELEGATE, NEVER_DATE, 3, true, 0]
    );

    const region = within(summary());
    const terms = region.getAllByRole("term").map((term) => term.textContent);
    const values = region
      .getAllByRole("definition")
      .map((value) => value.textContent);
    expect(terms).toEqual([
      "Collection",
      "Use case",
      "Delegate address",
      "Expiry",
      "Tokens",
    ]);
    expect(values).toEqual([
      `The Memes${MEMES_CONTRACT}`,
      "#3 - Airdrops",
      DELEGATE,
      "Never",
      "All tokens",
    ]);
  });

  it("shows a chosen expiry and token exactly as written", () => {
    renderForm({ collection: "MEMES", use_case: "3" });
    enterDelegate(DELEGATE);
    fireEvent.click(screen.getByRole("radio", { name: "Select Date" }));
    fireEvent.change(screen.getByLabelText("Expiry Date"), {
      target: { value: "2030-01-02" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Select Token ID" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Token ID" }), {
      target: { value: "42" },
    });

    const args = latestSubmit().writeParams.args;
    expect(latestSubmit().writeParams.functionName).toBe(
      "registerDelegationAddress"
    );
    expect(args.slice(3)).toEqual([3, false, 42]);
    const expiry = args[2];
    if (typeof expiry !== "number") {
      throw new Error("expiry is not a number");
    }
    expect(expiry).not.toBe(NEVER_DATE);

    const values = within(summary())
      .getAllByRole("definition")
      .map((value) => value.textContent);
    expect(values.slice(3)).toEqual([
      formatDelegationExpiryLocal("en-US", expiry, getViewerTimeZone()),
      "Token ID 42",
    ]);
  });

  it("follows the form when a field changes", () => {
    renderForm({ collection: "MEMES", use_case: "3" });
    enterDelegate(DELEGATE);
    fireEvent.change(screen.getByRole("combobox", { name: "Use Case" }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), {
      target: { value: GRADIENTS_COLLECTION.contract },
    });

    expect(latestSubmit().writeParams.args.slice(0, 4)).toEqual([
      GRADIENTS_COLLECTION.contract,
      DELEGATE,
      NEVER_DATE,
      2,
    ]);
    const values = within(summary())
      .getAllByRole("definition")
      .map((value) => value.textContent);
    expect(values.slice(0, 3)).toEqual([
      `6529 Gradient${GRADIENTS_COLLECTION.contract}`,
      "#2 - Minting / Allowlist",
      DELEGATE,
    ]);
  });

  it("includes the original delegator for a delegation manager", () => {
    render(
      <NewDelegation
        address={DELEGATOR}
        ens={null}
        subdelegation={{
          originalDelegator: ORIGINAL_DELEGATOR,
          collection: MEMES_COLLECTION,
        }}
        collection_query={MEMES_CONTRACT}
        use_case_query={2}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    enterDelegate(DELEGATE);

    expect(latestSubmit().writeParams.functionName).toBe(
      "registerDelegationAddressUsingSubDelegation"
    );
    expect(latestSubmit().writeParams.args.slice(0, 3)).toEqual([
      ORIGINAL_DELEGATOR,
      MEMES_CONTRACT,
      DELEGATE,
    ]);
    const region = within(summary());
    expect(region.getAllByRole("term")[0]).toHaveTextContent(
      "Original delegator"
    );
    expect(region.getAllByRole("definition")[0]).toHaveTextContent(
      ORIGINAL_DELEGATOR
    );
  });
});
