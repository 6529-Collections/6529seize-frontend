import { act, render, screen } from "@testing-library/react";
import { WaveChatUnreadBadge } from "@/components/brain/my-stream/WaveChatUnread";
import { WaveChatTitle } from "@/components/brain/my-stream/WaveChatTitle";
import {
  WaveUnreadProvider,
  type WaveUnreadSource,
} from "@/contexts/wave/WaveUnreadContext";
import { createWaveUnreadStore } from "@/contexts/wave/hooks/waveUnreadStore";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const mockSetWaveData = jest.fn();
const mockWave: MinimalWave = {
  id: "wave-1",
  name: "Main Stage",
  type: ApiWaveType.Rank,
  createdAt: 0,
  picture: null,
  contributors: [],
  isPinned: false,
  isFollowing: true,
  isOfficial: false,
  isMuted: false,
  parentWaveId: null,
  hasSubwaves: false,
  followedSubwavesCount: 0,
  latestFollowedSubwaveDropTimestamp: null,
  unreadSubwaveDrops: 0,
  unreadDropsCount: 0,
  latestReadTimestamp: 0,
  firstUnreadDropSerialNo: null,
  firstUnreadFollowedSubwaveDropSerialNo: null,
  waveRep: null,
  waveScore: null,
  sidebarSection: null,
  sidebarActivityTimestamp: null,
  isFollowedSubwaveContainer: false,
  newDropsCount: {
    count: 0,
    latestDropTimestamp: null,
    firstUnreadSerialNo: null,
  },
};

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    waves: { list: [mockWave] },
    directMessages: { list: [] },
  }),
}));
jest.mock("@/contexts/TitleContext", () => ({
  useSetWaveData: (data: unknown) => mockSetWaveData(data),
}));

beforeEach(() => {
  mockSetWaveData.mockClear();
  mockWave.isMuted = false;
  mockWave.unreadDropsCount = 0;
});

it("updates only the badge outside Chat and only Chat contributes title counts", () => {
  const store = createWaveUnreadStore();
  const resolve: WaveUnreadSource["resolve"] = (wave, unread) => ({
    ...wave,
    unreadDropsCount: unread?.newDrops?.count ?? 0,
    newDropsCount: unread?.newDrops ?? wave.newDropsCount,
  });
  const source = { store, resolve };
  const parentRender = jest.fn();
  function Tabs({ chatActive }: { readonly chatActive: boolean }) {
    parentRender();
    return (
      <WaveUnreadProvider value={source}>
        <WaveChatTitle
          waveId="wave-1"
          waveName="Main Stage"
          chatActive={chatActive}
        />
        <WaveChatUnreadBadge waveId="wave-1" />
      </WaveUnreadProvider>
    );
  }
  const { rerender } = render(<Tabs chatActive={false} />);
  const rendersBeforeMessage = parentRender.mock.calls.length;
  const titleUpdatesBeforeMessage = mockSetWaveData.mock.calls.length;
  act(() =>
    store.updateNewDropsCounts(() => ({
      "wave-1": { count: 3, latestDropTimestamp: 30, firstUnreadSerialNo: 11 },
    }))
  );
  expect(screen.getByLabelText("3 unread messages")).toHaveTextContent("3");
  expect(parentRender).toHaveBeenCalledTimes(rendersBeforeMessage);
  expect(mockSetWaveData).toHaveBeenCalledTimes(titleUpdatesBeforeMessage);
  expect(mockSetWaveData).toHaveBeenLastCalledWith({
    id: "wave-1",
    name: "Main Stage",
    newItemsCount: 0,
  });
  rerender(<Tabs chatActive />);
  expect(mockSetWaveData).toHaveBeenLastCalledWith({
    id: "wave-1",
    name: "Main Stage",
    newItemsCount: 3,
  });
  act(() =>
    store.updateNewDropsCounts(() => ({
      "wave-1": {
        count: 0,
        latestDropTimestamp: 30,
        firstUnreadSerialNo: null,
      },
    }))
  );
  expect(screen.queryByLabelText(/unread messages/)).not.toBeInTheDocument();
});

it("hides muted-wave badges", () => {
  mockWave.isMuted = true;
  mockWave.unreadDropsCount = 5;
  const store = createWaveUnreadStore();
  const subscribe = jest.spyOn(store, "subscribe");
  render(
    <WaveUnreadProvider value={{ store, resolve: (wave) => wave }}>
      <WaveChatUnreadBadge waveId="wave-1" />
    </WaveUnreadProvider>
  );
  expect(screen.queryByText("5")).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/unread messages/)).not.toBeInTheDocument();
  expect(subscribe).not.toHaveBeenCalled();
  mockWave.unreadDropsCount = 0;
});

it("keeps the exact count accessible when the visible badge caps at 99+", () => {
  mockWave.unreadDropsCount = 150;
  render(<WaveChatUnreadBadge waveId="wave-1" />);
  expect(screen.getByLabelText("150 unread messages")).toHaveTextContent("99+");
});
