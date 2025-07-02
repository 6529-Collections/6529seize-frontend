import { getServerSideProps } from "../../../../pages/nextgen/token/[token]/[[...view]]/index";
import { ContentView } from "../../../../components/nextGen/collections/collectionParts/NextGenCollection";
import { getCommonHeaders } from "../../../../helpers/server.helpers";
import { commonApiFetch } from "../../../../services/api/common-api";
import { isEmptyObject } from "../../../../helpers/Helpers";

jest.mock("../../../../helpers/server.helpers", () => ({
  getCommonHeaders: jest.fn(() => ({ h: "h" })),
}));
jest.mock("../../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("../../../../helpers/Helpers", () => ({
  isEmptyObject: jest.fn(() => false),
}));

const mockedHeaders = getCommonHeaders as jest.Mock;
const mockedFetch = commonApiFetch as jest.Mock;
const mockedEmpty = isEmptyObject as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BASE_ENDPOINT = "https://base.6529.io";
});

describe("nextgen token page getServerSideProps", () => {
  it("fetches token, traits and collection", async () => {
    mockedFetch.mockImplementation(async ({ endpoint }) => {
      if (endpoint === "nextgen/tokens/1")
        return { id: 1, name: "Tok", collection_id: 2 };
      if (endpoint === "nextgen/tokens/1/traits") return [{ token_count: 5 }];
      if (endpoint === "nextgen/collections/2")
        return { id: 2, name: "Coll", banner: "b" };
    });

    const res = await getServerSideProps(
      { query: { token: 1, view: ["provenance"] }, req: {} } as any,
      {} as any,
      "/p"
    );
    expect(mockedHeaders).toHaveBeenCalled();
    expect(res).toHaveProperty("props.token.id", 1);
    expect(res.props.tokenCount).toBe(5);
    expect(res.props.view).toBe(ContentView.PROVENANCE);
    expect(res.props.metadata.title).toBe("Tok | Provenance");
  });

  it("redirects when collection empty", async () => {
    mockedFetch
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    mockedEmpty.mockReturnValue(true);
    const res = await getServerSideProps(
      { query: { token: 5 }, req: {} } as any,
      {} as any,
      "/p"
    );
    expect(res).toEqual({
      redirect: { permanent: false, destination: "/404" },
      props: {},
    });
  });
});
