import MemeLabPage, { generateMetadata } from "@/app/meme-lab/[id]/page";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import { render, screen } from "@testing-library/react";

const mockMemeLabPageComponent = jest.fn(
  (props: { readonly nftId: string; readonly locale: string }) => (
    <div data-testid="meme-lab-page" data-locale={props.locale}>
      Meme Lab #{props.nftId}
    </div>
  )
);

const mockGetSharedAppServerSideProps = jest.fn();

jest.mock("@/components/memelab/MemeLabPage", () => ({
  __esModule: true,
  default: (props: { readonly nftId: string; readonly locale: string }) =>
    mockMemeLabPageComponent(props),
}));

jest.mock("@/components/the-memes/MemePageSkeleton", () => ({
  MemePageSkeleton: () => <div data-testid="meme-lab-page-skeleton" />,
}));

jest.mock("@/components/the-memes/MemeShared", () => ({
  getSharedAppServerSideProps: (...args: unknown[]) =>
    mockGetSharedAppServerSideProps(...args),
}));

describe("Meme Lab detail page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the client detail page with the default locale", async () => {
    const page = await MemeLabPage({
      params: Promise.resolve({ id: "123" }),
    });

    render(page);

    expect(await screen.findByTestId("meme-lab-page")).toHaveAttribute(
      "data-locale",
      "en-US"
    );
    expect(mockMemeLabPageComponent).toHaveBeenCalledWith({
      nftId: "123",
      locale: "en-US",
    });
  });

  it("passes supported locale search params to the client detail page", async () => {
    const page = await MemeLabPage({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({ locale: "de-DE" }),
    });

    render(page);

    expect(await screen.findByTestId("meme-lab-page")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
  });

  it("passes locale and focus to shared metadata generation", async () => {
    mockGetSharedAppServerSideProps.mockResolvedValue({
      title: "Metadata title",
    });

    const result = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({
        focus: "collectors",
        locale: "de-DE",
      }),
    });

    expect(result).toEqual({ title: "Metadata title" });
    expect(mockGetSharedAppServerSideProps).toHaveBeenCalledWith(
      MEMELAB_CONTRACT,
      "123",
      "collectors",
      false,
      "de-DE"
    );
  });
});
