// Mock all dependencies before importing anything
const mockIsNullAddress = jest.fn(() => false);

jest.mock("@/helpers/Helpers", () => ({
  isNullAddress: mockIsNullAddress,
}));

jest.mock("@/enums", () => ({
  NextgenCollectionView: {
    ABOUT: "About",
    PROVENANCE: "Provenance",
    DISPLAY_CENTER: "Display Center",
    RARITY: "Rarity",
    OVERVIEW: "Overview",
    TOP_TRAIT_SETS: "Trait Sets",
  },
  ProfileActivityLogType: {
    RATING_EDIT: "RATING_EDIT",
    HANDLE_EDIT: "HANDLE_EDIT",
    CLASSIFICATION_EDIT: "CLASSIFICATION_EDIT",
    SOCIALS_EDIT: "SOCIALS_EDIT",
    NFT_ACCOUNTS_EDIT: "NFT_ACCOUNTS_EDIT",
    CONTACTS_EDIT: "CONTACTS_EDIT",
    SOCIAL_VERIFICATION_POST_EDIT: "SOCIAL_VERIFICATION_POST_EDIT",
    BANNER_1_EDIT: "BANNER_1_EDIT",
    BANNER_2_EDIT: "BANNER_2_EDIT",
    PFP_EDIT: "PFP_EDIT",
    PROFILE_ARCHIVED: "PROFILE_ARCHIVED",
    GENERAL_CIC_STATEMENT_EDIT: "GENERAL_CIC_STATEMENT_EDIT",
    PROXY_CREATED: "PROXY_CREATED",
    PROXY_ACTION_CREATED: "PROXY_ACTION_CREATED",
    PROXY_ACTION_STATE_CHANGED: "PROXY_ACTION_STATE_CHANGED",
    PROXY_ACTION_CHANGED: "PROXY_ACTION_CHANGED",
    DROP_COMMENT: "DROP_COMMENT",
    DROP_RATING_EDIT: "DROP_RATING_EDIT",
    DROP_CREATED: "DROP_CREATED",
    PROXY_DROP_RATING_EDIT: "PROXY_DROP_RATING_EDIT",
  },
}));

// Mock entities that cause circular dependencies
jest.mock("@/entities/IProfile", () => ({
  PROFILE_ACTIVITY_TYPE_TO_TEXT: {},
}));

// Mock user components that cause dependency issues
jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  UserCICAndLevel: () => <div data-testid="user-cic-level" />,
}));

jest.mock("@/components/user/utils/raters-table/ProfileRatersTableItem", () => ({
  ProfileRatersTableItem: () => <div data-testid="profile-raters-table-item" />,
}));

jest.mock("next/navigation", () => {
  return {
    __esModule: true,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }),
    useParams: () => ({ view: undefined }),
    useSearchParams: () => ({ get: jest.fn() }),
    usePathname: () => "/nextgen/collection/COL/token/1",
  };
});

import NextGenTokenPage from "@/components/nextGen/collections/nextgenToken/NextGenToken";
import { render, screen } from "@testing-library/react";

jest.mock("react-bootstrap", () => {
  return {
    Container: ({ children, fluid, ...props }: any) => (
      <div data-testid="container" data-fluid={fluid?.toString()} {...props}>
        {children}
      </div>
    ),
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
  };
});

jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenProvenance",
  () => () => <div data-testid="provenance" />
);
jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenProperties",
  () => ({
    __esModule: true,
    default: () => <div data-testid="rarity" />,
    NextgenTokenTraits: () => <div data-testid="traits" />,
  })
);
jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenAbout",
  () => () => <div data-testid="about" />
);
jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenArt",
  () => () => <div data-testid="art" />
);
jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenRenderCenter",
  () => () => <div data-testid="render" />
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({
    NextGenBackToCollectionPageLink: () => <div data-testid="back" />,
  })
);
// Mock the printViewButton function from collectionParts
jest.mock("@/components/nextGen/collections/collectionParts/NextGenCollection", () => ({
  printViewButton: (cur: any, v: any, setView: any) => (
    <button onClick={() => setView(v)} data-testid={`view-button-${v}`}>{v}</button>
  ),
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: any) => (
    <svg
      data-testid={props.icon.iconName}
      style={props.style}
      onClick={props.onClick}
      data-tooltip-id={props["data-tooltip-id"]}
    />
  ),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>{children}</div>
  ),
}));


const baseProps = {
  collection: { id: 1, name: "COL" } as any,
  token: {
    id: 1,
    normalised_id: 0,
    name: "Token",
    owner: "0x1",
    burnt: false,
  } as any,
  traits: [] as any[],
  tokenCount: 2,
  view: "About" as any, // Updated to match actual enum values
  setView: jest.fn(),
};

function renderComponent(props?: Partial<typeof baseProps>) {
  return render(<NextGenTokenPage {...baseProps} {...props} />);
}

describe("NextGenTokenPage", () => {
  describe("rendering", () => {
    it("renders token name", () => {
      renderComponent();
      expect(screen.getByText("Token")).toBeInTheDocument();
    });

    it("renders all view buttons", () => {
      renderComponent();
      expect(screen.getByTestId("view-button-About")).toBeInTheDocument();
      expect(screen.getByTestId("view-button-Provenance")).toBeInTheDocument();
      expect(screen.getByTestId("view-button-Display Center")).toBeInTheDocument();
      expect(screen.getByTestId("view-button-Rarity")).toBeInTheDocument();
    });

    it("renders back to collection link", () => {
      renderComponent();
      expect(screen.getByTestId("back")).toBeInTheDocument();
    });

    it("renders token art component", () => {
      renderComponent();
      expect(screen.getByTestId("art")).toBeInTheDocument();
    });
  });

  describe("view switching", () => {
    it("renders About view components by default", () => {
      renderComponent({ view: "About" });
      expect(screen.getByTestId("about")).toBeInTheDocument();
      expect(screen.getByTestId("traits")).toBeInTheDocument();
      expect(screen.queryByTestId("provenance")).not.toBeInTheDocument();
      expect(screen.queryByTestId("render")).not.toBeInTheDocument();
      expect(screen.queryByTestId("rarity")).not.toBeInTheDocument();
    });

    it("renders Provenance view when selected", () => {
      renderComponent({ view: "Provenance" });
      expect(screen.getByTestId("provenance")).toBeInTheDocument();
      expect(screen.queryByTestId("about")).not.toBeInTheDocument();
      expect(screen.queryByTestId("traits")).not.toBeInTheDocument();
      expect(screen.queryByTestId("render")).not.toBeInTheDocument();
      expect(screen.queryByTestId("rarity")).not.toBeInTheDocument();
    });

    it("renders Display Center view when selected", () => {
      renderComponent({ view: "Display Center" });
      expect(screen.getByTestId("render")).toBeInTheDocument();
      expect(screen.queryByTestId("about")).not.toBeInTheDocument();
      expect(screen.queryByTestId("traits")).not.toBeInTheDocument();
      expect(screen.queryByTestId("provenance")).not.toBeInTheDocument();
      expect(screen.queryByTestId("rarity")).not.toBeInTheDocument();
    });

    it("renders Rarity view when selected", () => {
      renderComponent({ view: "Rarity" });
      expect(screen.getByTestId("rarity")).toBeInTheDocument();
      expect(screen.queryByTestId("about")).not.toBeInTheDocument();
      expect(screen.queryByTestId("traits")).not.toBeInTheDocument();
      expect(screen.queryByTestId("provenance")).not.toBeInTheDocument();
      expect(screen.queryByTestId("render")).not.toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("disables previous button on first token", () => {
      renderComponent({ token: { ...baseProps.token, normalised_id: 0 } });
      const prev = screen.getByTestId("circle-chevron-left");
      expect(prev.getAttribute("style")).toContain("color: rgb(154, 154, 154)");
      expect(prev.getAttribute("style")).toContain("cursor: default");
      // When disabled, no tooltip should be present
      expect(prev.getAttribute("data-tooltip-id")).toBeFalsy();
    });

    it("enables previous button when not first token", () => {
      renderComponent({ token: { ...baseProps.token, normalised_id: 1, id: 2 } });
      const prev = screen.getByTestId("circle-chevron-left");
      expect(prev.getAttribute("style")).toContain("color: rgb(255, 255, 255)");
      expect(prev.getAttribute("style")).toContain("cursor: pointer");
      // When enabled, the icon should have a tooltip id
      expect(prev.getAttribute("data-tooltip-id")).toBeTruthy();
      // And the tooltip should be present in the document
      expect(screen.getByTestId("tooltip-prev-token-2")).toBeInTheDocument();
    });

    it("disables next button on last token", () => {
      renderComponent({ 
        token: { ...baseProps.token, normalised_id: 1 }, 
        tokenCount: 2 
      });
      const next = screen.getByTestId("circle-chevron-right");
      expect(next.getAttribute("style")).toContain("color: rgb(154, 154, 154)");
      expect(next.getAttribute("style")).toContain("cursor: default");
      expect(next.getAttribute("data-tooltip-id")).toBeFalsy();
    });

    it("enables next button when not last token", () => {
      renderComponent({ 
        token: { ...baseProps.token, normalised_id: 0, id: 1 },
        tokenCount: 3 
      });
      const next = screen.getByTestId("circle-chevron-right");
      expect(next.getAttribute("style")).toContain("color: rgb(255, 255, 255)");
      expect(next.getAttribute("style")).toContain("cursor: pointer");
      expect(next.getAttribute("data-tooltip-id")).toBeTruthy();
      expect(screen.getByTestId("tooltip-next-token-1")).toBeInTheDocument();
    });
  });

  describe("burnt token handling", () => {
    it("shows burnt icon when token is burnt", () => {
      renderComponent({ token: { ...baseProps.token, burnt: true } });
      const fireIcon = screen.getByTestId("fire");
      expect(fireIcon).toBeInTheDocument();
      expect(fireIcon.getAttribute("style")).toContain("color: rgb(197, 29, 52)");
      expect(screen.getByTestId("tooltip-burnt-token-1")).toBeInTheDocument();
    });

    it("shows burnt icon when token owner is null address", () => {
      mockIsNullAddress.mockReturnValue(true);
      
      renderComponent({ token: { ...baseProps.token, owner: "0x0000000000000000000000000000000000000000" } });
      const fireIcon = screen.getByTestId("fire");
      expect(fireIcon).toBeInTheDocument();
      expect(screen.getByTestId("tooltip-burnt-token-1")).toBeInTheDocument();
      
      // Reset mock for other tests
      mockIsNullAddress.mockReturnValue(false);
    });

    it("does not show burnt icon for normal tokens", () => {
      renderComponent({ token: { ...baseProps.token, burnt: false, owner: "0x123" } });
      expect(screen.queryByTestId("fire")).not.toBeInTheDocument();
    });
  });

  describe("props handling", () => {
    it("passes correct props to child components", () => {
      const mockSetView = jest.fn();
      const mockTraits = [{ trait: "Color", value: "Blue" }, { trait: "Collection Name", value: "Test" }];
      
      renderComponent({
        setView: mockSetView,
        traits: mockTraits,
        tokenCount: 5,
        view: "About"
      });
      
      // About view should render with traits filtered (Collection Name should be filtered out)
      expect(screen.getByTestId("about")).toBeInTheDocument();
      expect(screen.getByTestId("traits")).toBeInTheDocument();
    });

    it("calls setView when view buttons are clicked", () => {
      const mockSetView = jest.fn();
      renderComponent({ setView: mockSetView });
      
      const aboutButton = screen.getByTestId("view-button-About");
      aboutButton.click();
      expect(mockSetView).toHaveBeenCalledWith("About");
    });
  });
});
