import CreateSnapshotFormSearchCollection from "@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollection";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "@/services/distribution-plan-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let clickAwayCb: () => void;
let keyPressCb: () => void;
let dropdownSelection: any;

jest.mock("react-use", () => {
  const React = require("react");
  return {
    useClickAway: (_ref: any, cb: () => void) => {
      clickAwayCb = cb;
    },
    useKeyPressEvent: (_key: string, cb: () => void) => {
      keyPressCb = cb;
    },
    useDebounce: (fn: () => void, _delay: number, deps: any[]) => {
      React.useEffect(fn, deps);
    },
  };
});

jest.mock(
  "@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionInput",
  () => (props: any) => (
    <input
      data-testid="input"
      value={props.keyword}
      onChange={(e: any) => props.setKeyword(e.target.value)}
      onClick={props.openDropdown}
    />
  )
);

jest.mock(
  "@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdown",
  () => (props: any) => (
    <button
      data-testid="dropdown"
      onClick={() => props.onCollection(dropdownSelection)}
    >
      select
    </button>
  )
);

jest.mock(
  "@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionMemesModal",
  () => (props: any) => (
    <button
      data-testid="memes-modal-button"
      onClick={() =>
        props.onMemesCollection({
          address: MEMES_CONTRACT.toLowerCase(),
          name: "The Memes by 6529",
          tokenIds: null,
        })
      }
    />
  )
);

jest.mock(
  "@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper",
  () => ({
    __esModule: true,
    default: ({ showModal, children }: any) =>
      showModal ? <div data-testid="modal">{children}</div> : null,
    AllowlistToolModalSize: { X_LARGE: "X_LARGE" },
  })
);

jest.mock("@/services/distribution-plan-api", () => ({
  distributionPlanApiFetch: jest.fn(),
  distributionPlanApiPost: jest.fn(),
}));

const fetchMock = distributionPlanApiFetch as jest.Mock;
const postMock = distributionPlanApiPost as jest.Mock;

function renderComponent(setCollection = jest.fn()) {
  return {
    setCollection,
    ...render(
      <CreateSnapshotFormSearchCollection setCollection={setCollection} />
    ),
  };
}

describe("CreateSnapshotFormSearchCollection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dropdownSelection = undefined;
  });

  it("fetches default collections on mount", async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: [] });
    renderComponent();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/other/memes-collections")
    );
  });

  it("fetches collections when keyword has 3 letters", async () => {
    fetchMock.mockResolvedValue({ success: true, data: [] });
    postMock.mockResolvedValue({ success: true, data: [] });
    renderComponent();
    await userEvent.type(screen.getByTestId("input"), "abc");
    await waitFor(() => expect(postMock).toHaveBeenCalled());
    expect(postMock).toHaveBeenLastCalledWith({
      endpoint: "/other/search-contract-metadata",
      body: { keyword: "abc" },
    });
  });

  it("does not search when keyword shorter than 3 characters", async () => {
    fetchMock.mockResolvedValue({ success: true, data: [] });
    renderComponent();
    await userEvent.type(screen.getByTestId("input"), "ab");
    expect(postMock).not.toHaveBeenCalled();
  });

  it("selects normal collection from dropdown", async () => {
    fetchMock.mockResolvedValue({ success: true, data: [] });
    const selection = { address: "0x123", name: "Other", tokenIds: null };
    dropdownSelection = selection;
    const { setCollection } = renderComponent();
    await userEvent.click(screen.getByTestId("input"));
    await userEvent.click(screen.getByTestId("dropdown"));
    expect(setCollection).toHaveBeenCalledWith(selection);
  });

  it("opens modal for memes collection and handles selection", async () => {
    fetchMock.mockResolvedValue({ success: true, data: [] });
    dropdownSelection = {
      address: MEMES_CONTRACT.toLowerCase(),
      name: "The Memes by 6529",
      tokenIds: null,
    };
    const { setCollection } = renderComponent();
    await userEvent.click(screen.getByTestId("input"));
    await userEvent.click(screen.getByTestId("dropdown"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(setCollection).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("memes-modal-button"));
    expect(setCollection).toHaveBeenCalledWith({
      address: MEMES_CONTRACT.toLowerCase(),
      name: "The Memes by 6529",
      tokenIds: null,
    });
  });
});
