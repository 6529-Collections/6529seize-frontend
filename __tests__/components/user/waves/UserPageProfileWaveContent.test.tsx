import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import UserPageProfileWaveContent from "@/components/user/waves/UserPageProfileWaveContent";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";

jest.mock("@/hooks/useWaveCurationDrops", () => ({
  useWaveCurationDrops: jest.fn(),
}));

jest.mock("@/components/user/waves/UserPageProfileWaveMasonry", () => ({
  __esModule: true,
  default: ({ curationId }: { readonly curationId: string }) => (
    <div data-testid="profile-curation-masonry">{curationId}</div>
  ),
}));

const useWaveCurationDropsMock = useWaveCurationDrops as jest.Mock;

const wave = { id: "wave-1" } as any;
const curation = { id: "curation-1", name: "Art" } as any;
const drop = {
  id: "drop-1",
  stableKey: "drop-1",
  parts: [],
  metadata: [],
} as any;

const renderContent = (
  props: Partial<React.ComponentProps<typeof UserPageProfileWaveContent>> = {}
) =>
  render(
    <UserPageProfileWaveContent
      canManageOwnOfficialWave={true}
      containerWidth={600}
      onAddPost={jest.fn()}
      onCreateCuration={jest.fn()}
      profileIdentity={{ id: "profile-1", handle: "alice" }}
      areCurationsError={false}
      areCurationsFetching={false}
      areCurationsLoading={false}
      hasLoadedCurations={true}
      onRetryCurations={jest.fn()}
      profileCuration={curation}
      wave={wave}
      {...props}
    />
  );

describe("UserPageProfileWaveContent", () => {
  beforeEach(() => {
    useWaveCurationDropsMock.mockReturnValue({
      dataUpdatedAt: 1,
      drops: [drop],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      isPlaceholderData: false,
      refetch: jest.fn(),
    });
  });

  it("shows Add post for the owner when a selected curation has drops", () => {
    const onAddPost = jest.fn();

    renderContent({ onAddPost });

    fireEvent.click(screen.getByRole("button", { name: "Add post" }));

    expect(onAddPost).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("profile-curation-masonry")).toHaveTextContent(
      "curation-1"
    );
  });

  it("does not show Add post when the current viewer cannot manage the profile wave", () => {
    renderContent({ canManageOwnOfficialWave: false });

    expect(
      screen.queryByRole("button", { name: "Add post" })
    ).not.toBeInTheDocument();
  });

  it("shows Add post in the empty selected curation state", () => {
    const onAddPost = jest.fn();
    useWaveCurationDropsMock.mockReturnValue({
      dataUpdatedAt: 1,
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      isPlaceholderData: false,
      refetch: jest.fn(),
    });

    renderContent({ onAddPost });

    fireEvent.click(screen.getByRole("button", { name: "Add post" }));

    expect(onAddPost).toHaveBeenCalledTimes(1);
  });

  it("shows Create curation when the owner has no selected curation", () => {
    const onCreateCuration = jest.fn();

    renderContent({
      onCreateCuration,
      profileCuration: null,
    });

    fireEvent.click(screen.getByRole("button", { name: "Create curation" }));

    expect(onCreateCuration).toHaveBeenCalledTimes(1);
  });
});
