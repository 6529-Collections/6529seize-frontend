import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import RememePage from "@/components/rememes/RememePage";
import { TitleProvider } from "@/contexts/TitleContext";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement("img", {
      ...props,
      alt: props.alt ?? "rememe-page-component",
    }),
}));
jest.mock("@/components/nft-image/RememeImage", () => ({
  __esModule: true,
  default: () => <div data-testid="rememe-image" />,
}));
jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-image" />,
}));
jest.mock("@/components/address/Address", () => ({
  __esModule: true,
  default: (props: any) => <span>{props.wallets[0]}</span>,
}));
jest.mock("@/components/nothingHereYet/NothingHereYetSummer", () => ({
  __esModule: true,
  default: () => <div>Nothing here yet</div>,
}));
jest.mock("@/components/the-memes/ArtistProfileHandle", () => ({
  __esModule: true,
  default: () => <span>Artist profile handle</span>,
}));
jest.mock("@/components/dotLoader/DotLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ platform: "web" }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null, isLoading: false }),
}));
jest.mock("wagmi", () => ({ useEnsName: () => ({ data: "bob.eth" }) }));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg />,
}));

const fetchUrl = jest.fn();
const fetchAllPages = jest.fn();
jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: any[]) => fetchUrl(...args),
  fetchAllPages: (...args: any[]) => fetchAllPages(...args),
}));

const rememe = {
  id: "1",
  meme_references: [1],
  metadata: { name: "Meme Name", description: "desc" },
  contract: "0xabc",
  deployer: "0x1",
  added_by: "0x2",
  token_uri: "uri",
  token_type: "ERC721",
  replicas: ["1", "2"],
  contract_opensea_data: {
    collectionName: null,
    externalUrl: null,
    twitterUsername: null,
  },
};

const referenceMeme = {
  id: 1,
  name: "Reference Meme",
  artist: "Alice",
  contract: "0xmemes",
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("loads data and switches tabs", async () => {
  fetchUrl.mockResolvedValue({ data: [rememe] });
  fetchAllPages.mockResolvedValue([referenceMeme]);
  render(
    <CookieConsentProvider>
      <TitleProvider>
        <RememePage contract="0xabc" id="1" locale="de-DE" />
      </TitleProvider>
    </CookieConsentProvider>
  );

  await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
  // Name from metadata should render
  await screen.findByText("Meme Name");
  expect(screen.getByRole("link", { name: "Back to ReMemes" })).toHaveAttribute(
    "href",
    "/rememes?locale=de-DE"
  );
  expect(screen.getByRole("link", { name: "View replica #2" })).toHaveAttribute(
    "href",
    "/rememes/0xabc/2?locale=de-DE"
  );

  await userEvent.click(screen.getByRole("button", { name: "Metadata" }));
  expect(screen.getByRole("button", { name: "Metadata" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(await screen.findByText("Token URI")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "References" }));
  expect(
    await screen.findByRole("link", {
      name: "View referenced Meme Card #1: Reference Meme",
    })
  ).toHaveAttribute("href", "/the-memes/1?locale=de-DE");
});

it("encodes reserved route params before fetching the rememe", async () => {
  fetchUrl.mockResolvedValue({ data: [rememe] });
  fetchAllPages.mockResolvedValue([referenceMeme]);

  render(
    <CookieConsentProvider>
      <TitleProvider>
        <RememePage contract="collection/alpha" id="token#1" locale="de-DE" />
      </TitleProvider>
    </CookieConsentProvider>
  );

  await waitFor(() => expect(fetchUrl).toHaveBeenCalled());

  expect(fetchUrl.mock.calls[0]?.[0]).toContain(
    "contract=collection%2Falpha&id=token%231"
  );
});
