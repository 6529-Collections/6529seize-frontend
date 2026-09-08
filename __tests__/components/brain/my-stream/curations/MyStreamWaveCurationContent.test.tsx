import MyStreamWaveCurationContent from "@/components/brain/my-stream/curations/MyStreamWaveCurationContent";
import type Drop from "@/components/waves/drops/Drop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  type DropCurationMembership,
  useDropCurations,
} from "@/hooks/drops/useDropCurations";
import { render } from "@testing-library/react";
import type { ComponentProps } from "react";

const mockDrop = jest.fn<void, [ComponentProps<typeof Drop>]>();
let mockMemberships: DropCurationMembership[] | undefined;
let mockIsPlaceholderData = false;
const mockDrops = [
  { id: "drop-1", stableKey: "drop-1" },
  { id: "drop-2", stableKey: "drop-2" },
] as ExtendedDrop[];
const wave = { id: "wave-1" } as ApiWave;
const membership: DropCurationMembership = {
  id: "curation-1",
  name: "Marketplace",
  wave_id: "wave-1",
  group_id: "group-1",
  created_at: 0,
  updated_at: 0,
  priority_order: 1,
  drop_included: true,
  authenticated_user_can_curate: true,
};

jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  DropLocation: { WAVE: "WAVE" },
  default: (props: ComponentProps<typeof Drop>) => {
    mockDrop(props);
    return <div>{props.drop.id}</div>;
  },
}));
jest.mock("@/hooks/useWaveCurationDrops", () => ({
  useWaveCurationDrops: () => ({
    drops: mockDrops,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isPlaceholderData: mockIsPlaceholderData,
  }),
}));
jest.mock("@/hooks/drops/useDropCurations", () => ({
  useDropCurations: jest.fn(() => ({ data: mockMemberships })),
}));
jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: () => ({}),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ leaderboardViewStyle: {} }),
}));

const mockedUseDropCurations = jest.mocked(useDropCurations);

beforeEach(() => {
  mockDrop.mockClear();
  mockedUseDropCurations.mockClear();
  mockMemberships = undefined;
  mockIsPlaceholderData = false;
});

it("shares one permission probe and withholds removal until permission is confirmed", () => {
  const { rerender } = render(
    <MyStreamWaveCurationContent
      wave={wave}
      curationId="curation-1"
      curationName="Marketplace"
    />
  );

  expect(mockedUseDropCurations).toHaveBeenCalledTimes(1);
  expect(mockedUseDropCurations).toHaveBeenCalledWith({
    dropId: "drop-1",
    enabled: true,
  });
  expect(mockDrop).toHaveBeenCalledTimes(2);
  for (const [props] of mockDrop.mock.calls) {
    expect(props.showStandaloneActionsButton).toBe(true);
    expect(props.standaloneQuickRemoveCuration).toBeNull();
  }

  mockMemberships = [membership];
  mockDrop.mockClear();
  rerender(
    <MyStreamWaveCurationContent
      wave={wave}
      curationId="curation-1"
      curationName="Marketplace"
    />
  );

  for (const [props] of mockDrop.mock.calls) {
    expect(props.showStandaloneActionsButton).toBe(true);
    expect(props.standaloneQuickRemoveCuration).toEqual({
      id: "curation-1",
      name: "Marketplace",
    });
  }
});

it("keeps curation-only mode without removal for readers who cannot curate", () => {
  mockMemberships = [{ ...membership, authenticated_user_can_curate: false }];
  render(<MyStreamWaveCurationContent wave={wave} curationId="curation-1" />);

  for (const [props] of mockDrop.mock.calls) {
    expect(props.showStandaloneActionsButton).toBe(true);
    expect(props.standaloneQuickRemoveCuration).toBeNull();
  }
});

it("withholds removal from previous-tab placeholder posts", () => {
  mockMemberships = [membership];
  mockIsPlaceholderData = true;
  render(<MyStreamWaveCurationContent wave={wave} curationId="curation-1" />);

  expect(mockedUseDropCurations).toHaveBeenCalledWith({
    dropId: "",
    enabled: false,
  });
  for (const [props] of mockDrop.mock.calls) {
    expect(props.standaloneQuickRemoveCuration).toBeNull();
  }
});

it("requires permission for the active curation instead of another manageable curation", () => {
  mockMemberships = [membership];
  render(<MyStreamWaveCurationContent wave={wave} curationId="curation-2" />);

  for (const [props] of mockDrop.mock.calls) {
    expect(props.standaloneQuickRemoveCuration).toBeNull();
  }
});
