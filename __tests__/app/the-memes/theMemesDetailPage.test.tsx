import { generateMetadata } from "@/app/the-memes/[id]/page";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "@/constants/constants";

jest.mock("@/components/the-memes/MemePage", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@/components/the-memes/MemeShared", () => ({
  getSharedAppServerSideProps: jest.fn(),
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.io",
  },
}));

const mockShared = getSharedAppServerSideProps as jest.Mock;

describe("The Memes detail generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("canonicalizes locale query variants to the base card URL", async () => {
    mockShared.mockResolvedValue({
      title: "Meme",
      alternates: {
        languages: {
          "en-US": "https://6529.io/the-memes/123",
        },
      },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({
        focus: "history",
        locale: "fr-FR",
      }),
    });

    expect(mockShared).toHaveBeenCalledWith(
      MEMES_CONTRACT,
      "123",
      "history",
      false,
      "fr-FR"
    );
    expect(metadata.alternates).toMatchObject({
      canonical: "https://6529.io/the-memes/123",
      languages: {
        "en-US": "https://6529.io/the-memes/123",
      },
    });
  });
});
