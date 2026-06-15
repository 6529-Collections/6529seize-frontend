import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWavePollDrops } from "@/hooks/useWavePollDrops";
import {
  fetchDropsV2ByIds,
  fetchWavePollsV2,
} from "@/services/api/wave-drops-v2-api";
import { renderHook } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/wave-drops-v2-api", () => {
  const actual = jest.requireActual("@/services/api/wave-drops-v2-api");
  return {
    ...actual,
    fetchDropsV2ByIds: jest.fn(),
    fetchWavePollsV2: jest.fn(),
  };
});

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const fetchWavePollsV2Mock = fetchWavePollsV2 as jest.MockedFunction<
  typeof fetchWavePollsV2
>;
const fetchDropsV2ByIdsMock = fetchDropsV2ByIds as jest.MockedFunction<
  typeof fetchDropsV2ByIds
>;

const wave = {
  id: "wave-1",
  name: "Wave 1",
  picture: null,
  description_drop_id: "",
  last_drop_time: 0,
  submission_type: null,
  authenticated_user_eligible_to_vote: true,
  authenticated_user_eligible_to_participate: true,
  authenticated_user_eligible_to_chat: true,
  authenticated_user_admin: false,
  visibility_group_id: null,
  participation_group_id: null,
  chat_group_id: null,
  voting_group_id: null,
  admin_group_id: null,
  voting_period_start: null,
  voting_period_end: null,
  voting_credit_type: "TDH",
  voting_credit_nfts: null,
  admin_drop_deletion_enabled: false,
  forbid_negative_votes: false,
  pinned: false,
  identity_wave: false,
  voting_credit_scope: "WAVE",
} as any;

const embeddedPollRow = {
  id: "drop-1",
  drop_id: "drop-1",
  serial_no: 1,
  created_at: 1000,
  updated_at: null,
  is_signed: false,
  hide_link_preview: false,
  title: "Do you like the new feature?",
  content: "",
  media: [],
  attachments: [],
  parts_count: 1,
  author: {
    id: "profile-1",
    handle: "alice",
    primary_address: "0x0000000000000000000000000000000000000001",
    pfp: null,
    level: 1,
    classification: "PSEUDONYM",
    badges: {},
  },
  drop_type: "CHAT",
  boosts: 0,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  nft_links: [],
  reactions: [],
  poll: {
    id: "poll-1",
    options: [
      { option_no: 1, option_string: "Yes", votes: 7 },
      { option_no: 2, option_string: "YES, BUT IN ALL CAPS!", votes: 32 },
    ],
    voted: [1],
    multichoice: false,
    anonymous: false,
    only_droppers_can_respond: false,
    closing_time: 2000,
    is_open: true,
  },
  options: [
    { option_no: 1, option_string: "Yes", votes: 7 },
    { option_no: 2, option_string: "YES, BUT IN ALL CAPS!", votes: 32 },
  ],
  voted: [2],
  multichoice: false,
  anonymous: true,
  only_droppers_can_respond: true,
  closing_time: 2000,
  is_open: true,
} as any;

describe("useWavePollDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
  });

  it("prefers poll row authenticated vote state over embedded drop poll state", async () => {
    fetchWavePollsV2Mock.mockResolvedValue({
      open_unanswered: 0,
      data: [embeddedPollRow],
      count: 1,
      page: 1,
      next: false,
    });

    renderHook(() =>
      useWavePollDrops({
        wave,
        sortDirection: "DESC" as any,
        sort: "created_at",
      })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.WAVE_POLLS,
          expect.objectContaining({ waveId: "wave-1" }),
        ],
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    const page = await options.queryFn({
      pageParam: 1,
      signal: new AbortController().signal,
    });

    expect(fetchDropsV2ByIdsMock).not.toHaveBeenCalled();
    expect(page.drops[0].poll).toMatchObject({
      id: "poll-1",
      voted: [2],
      only_droppers_can_respond: true,
    });
  });
});
