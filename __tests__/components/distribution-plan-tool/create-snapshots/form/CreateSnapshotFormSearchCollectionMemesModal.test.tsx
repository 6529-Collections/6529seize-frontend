import CreateSnapshotFormSearchCollectionMemesModal from "@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionMemesModal";
import { MEMES_CONTRACT } from "@/constants/constants";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/distribution-plan-api", () => ({
  distributionPlanApiFetch: jest.fn(),
}));

const fetchMock = distributionPlanApiFetch as jest.Mock;

const sampleSeasons = [
  { season: 1, tokenIds: "1,2" },
  { season: 2, tokenIds: "3,4" },
];

function setup(onMemesCollection = jest.fn()) {
  return {
    onMemesCollection,
    ...render(
      <CreateSnapshotFormSearchCollectionMemesModal
        collectionName="Snapshot"
        onMemesCollection={onMemesCollection}
      />
    ),
  };
}

describe("CreateSnapshotFormSearchCollectionMemesModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches seasons on mount and displays checkboxes", async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: sampleSeasons });
    setup();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/other/memes-seasons")
    );
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox")).toHaveLength(2)
    );
    expect(screen.getByText("SZN1 (1,2)")).toBeInTheDocument();
    expect(screen.getByText("SZN2 (3,4)")).toBeInTheDocument();
  });

  it("calls onMemesCollection with null tokenIds when no seasons selected", async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: sampleSeasons });
    const { onMemesCollection } = setup();
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox")).toHaveLength(2)
    );
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(onMemesCollection).toHaveBeenCalledWith({
      address: MEMES_CONTRACT.toLowerCase(),
      name: "The Memes by 6529",
      tokenIds: null,
    });
  });

  it("passes selected season token ids and name", async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: sampleSeasons });
    const { onMemesCollection } = setup();
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox")).toHaveLength(2)
    );
    await userEvent.click(screen.getByText("SZN1 (1,2)"));
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox")[0]).toBeChecked()
    );
    await userEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(onMemesCollection).toHaveBeenCalledWith({
      address: MEMES_CONTRACT.toLowerCase(),
      name: "Snapshot SZN1",
      tokenIds: "1,2",
    });
  });
});
