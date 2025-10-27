import HeaderSearchModalItem from "@/components/header/header-search/HeaderSearchModalItem";
import { MEMES_CONTRACT } from "@/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

const useHoverDirty = jest.fn();
const useRouter = jest.fn();

jest.mock("react-use", () => ({
  useHoverDirty: (...args: any[]) => useHoverDirty(...args),
}));

jest.mock("../../../hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
  })),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, onClick }: any) => (
    <a href={href} onClick={onClick} data-testid="link">
      {children}
    </a>
  ),
}));

const getProfileTargetRouteMock = jest.fn(() => "/profile-route");

jest.mock("@/helpers/Helpers", () => ({
  cicToType: (n: number) => `type${n}`,
  formatNumberWithCommas: (n: number) => `formatted-${n}`,
  getProfileTargetRoute: () => getProfileTargetRouteMock(),
}));

jest.mock(
  "@/components/header/header-search/HeaderSearchModalItemMedia",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div data-testid="media">{JSON.stringify(props)}</div>
    ),
  })
);

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  });
  jest.clearAllMocks();
});

it("renders profile item and handles interactions", () => {
  useHoverDirty.mockReturnValue(true);
  useRouter.mockReturnValue({ query: {} });
  const profile: any = {
    handle: "alice",
    wallet: "0x1",
    display: "Alice",
    level: 1,
    cic_rating: 2,
    tdh: 10,
  };
  const onClose = jest.fn();
  const onHover = jest.fn();
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <HeaderSearchModalItem
        content={profile as any}
        searchValue="ali"
        isSelected={false}
        onHover={onHover}
        onClose={onClose}
      />
    </QueryClientProvider>
  );
  expect(onHover).toHaveBeenCalledWith(true);
  const link = screen.getByTestId("link");
  expect(link).toHaveAttribute("href", "/profile-route");
  expect(screen.getByText(/Alice/i)).toBeInTheDocument();
  expect(link.textContent).toMatch(/Alice/i);
  expect(screen.getByText(/TDH: 10 - Level: 1/i)).toBeInTheDocument();
  fireEvent.click(link);
  expect(onClose).toHaveBeenCalled();
});

it("renders nft item with collection path", () => {
  useHoverDirty.mockReturnValue(false);
  useRouter.mockReturnValue({ query: {} });
  const nft: any = {
    id: 1,
    name: "Meme",
    contract: MEMES_CONTRACT.toLowerCase(),
    icon_url: "",
    thumbnail_url: "",
    image_url: "",
  };
  const onClose = jest.fn();
  const onHover = jest.fn();
  render(
    <HeaderSearchModalItem
      content={nft as any}
      searchValue="me"
      isSelected={false}
      onHover={onHover}
      onClose={onClose}
    />
  );
  expect(onHover).toHaveBeenCalledWith(false);
  const link = screen.getByTestId("link");
  expect(link).toHaveAttribute("href", "/the-memes/1");
  expect(link.textContent).toContain("Meme");
  expect(link.textContent).toContain("The Memes #1");
  expect(screen.getByTestId("media").textContent).toContain('"nft"');
  fireEvent.click(link);
  expect(onClose).toHaveBeenCalled();
});

it("renders wave item and uses query to build path", () => {
  useHoverDirty.mockReturnValue(false);
  useRouter.mockReturnValue({ query: { wave: "other" } });
  const wave: any = {
    id: "wave1",
    name: "Wave 1",
    picture: "pic.png",
    serial_no: 2,
  };
  const onClose = jest.fn();
  const onHover = jest.fn();
  render(
    <HeaderSearchModalItem
      content={wave as any}
      searchValue="wave"
      isSelected={false}
      onHover={onHover}
      onClose={onClose}
    />
  );
  const link = screen.getByTestId("link");
  expect(link).toHaveAttribute("href", "/waves?wave=wave1");
  expect(link.textContent).toContain("Wave 1");
  expect(link.textContent).toContain("Wave #2");
  expect(screen.getByTestId("media").textContent).toContain("pic.png");
});

it("renders page item and shows breadcrumbs", () => {
  useHoverDirty.mockReturnValue(false);
  useRouter.mockReturnValue({ query: {} });
  const PageIcon = ({ className }: { className?: string }) => (
    <div data-testid="page-icon" className={className} />
  );
  const page: any = {
    type: "PAGE",
    title: "Delegation FAQs",
    href: "/delegation/delegation-faq",
    breadcrumbs: ["Tools", "NFT Delegation"],
    icon: PageIcon,
  };
  const onClose = jest.fn();
  const onHover = jest.fn();
  render(
    <HeaderSearchModalItem
      content={page}
      searchValue="delegation"
      isSelected={false}
      onHover={onHover}
      onClose={onClose}
    />
  );
  const link = screen.getByTestId("link");
  expect(link).toHaveAttribute("href", "/delegation/delegation-faq");
  expect(link.textContent).toContain("Delegation FAQs");
  expect(link.textContent).toContain("Tools • NFT Delegation");
  expect(screen.getByTestId("page-icon")).toBeInTheDocument();
});
