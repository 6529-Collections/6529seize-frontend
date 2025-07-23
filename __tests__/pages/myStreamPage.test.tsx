import { getServerSideProps } from "@/pages/my-stream";
import { prefetchWavesOverview } from "@/helpers/stream.helpers";
import { getCommonHeaders } from "@/helpers/server.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { Time } from "@/helpers/time";

jest.mock("@/helpers/stream.helpers");
jest.mock("@/helpers/server.helpers");
jest.mock("@/services/api/common-api");

(getCommonHeaders as jest.Mock).mockReturnValue({ Authorization: "auth" });

const createContext = (overrides: any = {}) => ({
  query: {},
  req: { cookies: {} },
  ...overrides,
});

describe("my-stream getServerSideProps", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns default metadata without wave", async () => {
    const result = await getServerSideProps(createContext());
    expect(prefetchWavesOverview).not.toHaveBeenCalled();
    expect(result.props.metadata.title).toBe("My Stream");
    expect(result.props.metadata.description).toBe("Brain");
  });

  it("fetches wave data and prefetches when cookie stale", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      name: "WaveName",
      picture: "img.png",
      author: { handle: "alice" },
      metrics: { subscribers_count: 1, drops_count: 2 },
    });
    const old = Time.now().toMillis() - 60001;
    const context = createContext({
      query: { wave: "1234" },
      req: { cookies: { FEED_ITEMS: String(old) } },
    });

    const result = await getServerSideProps(context);

    expect(prefetchWavesOverview).toHaveBeenCalledWith(
      expect.objectContaining({
        queryClient: expect.anything(),
        headers: { Authorization: "auth" },
        waveId: "1234",
      })
    );
    expect(result.props.metadata.title).toBe("WaveName | My Stream");
    expect(result.props.metadata.ogImage).toBe("img.png");
    expect(result.props.metadata.description).toContain("@alice");
  });

  it("uses short id when wave fetch fails", async () => {
    (commonApiFetch as jest.Mock).mockRejectedValue(new Error("fail"));
    const old = Time.now().toMillis() - 60001;
    const context = createContext({
      query: { wave: "abcdef1234567890" },
      req: { cookies: { FEED_ITEMS: String(old) } },
    });

    const result = await getServerSideProps(context);
    expect(result.props.metadata.title).toBe(
      "Wave abcdef12...7890 | My Stream"
    );
  });
});
