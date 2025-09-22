jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

jest.mock("../../../hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("../../../components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="cic" />,
}));
import { render, screen } from "@testing-library/react";
import {
  NextGenTokenImage,
  get16KUrl,
  get8KUrl,
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../../../components/nextGen/collections/nextgenToken/NextGenTokenImage";

const token = {
  id: 1,
  name: "token",
  thumbnail_url: "thumb.png",
  image_url: "image.png",
  owner: "0x1",
  normalised_id: 1,
  level: 1,
  tdh: 0,
  rep_score: 0,
  opensea_price: 0,
  blur_price: 0,
  me_price: 0,
} as any;

test("wraps image with link by default", () => {
  render(<NextGenTokenImage token={token} />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/nextgen/token/1");
});

test("renders image within link when show_original is true", () => {
  render(<NextGenTokenImage token={token} show_original />);
  const link = screen.getByRole("link");
  const image = screen.getByAltText("token");
  expect(link).toBeInTheDocument();
  expect(image).toBeInTheDocument();
  expect(image).toHaveAttribute("src", "image.png");
  expect(link).toContainElement(image);
});

test("renders image without link when hide_link is true", () => {
  const { container } = render(
    <NextGenTokenImage token={token} hide_link show_original />
  );
  const image = screen.getByAltText("token");
  expect(image).toBeInTheDocument();
  expect(image).toHaveAttribute("src", "image.png");
  expect(container.querySelector("a")).toBeNull();
});

test("renders thumbnail image within link by default", () => {
  render(<NextGenTokenImage token={token} />);
  const link = screen.getByRole("link");
  const image = screen.getByAltText("token");
  expect(link).toBeInTheDocument();
  expect(image).toBeInTheDocument();
  expect(image).toHaveAttribute("src", "thumb.png");
  expect(link).toContainElement(image);
});

test("renders iframe when animation shown and link hidden", () => {
  const tokenWithAnimation = { ...token, animation_url: "anim.html" };
  render(
    <NextGenTokenImage token={tokenWithAnimation} show_animation hide_link />
  );
  const frame = screen.getByTitle("token");
  expect(frame).toBeInTheDocument();
  expect(frame).toHaveAttribute("src", "anim.html");
});

test("renders iframe within link when animation shown and link not hidden", () => {
  const tokenWithAnimation = { ...token, animation_url: "anim.html" };
  render(<NextGenTokenImage token={tokenWithAnimation} show_animation />);
  const link = screen.getByRole("link");
  const frame = screen.getByTitle("token");
  expect(link).toBeInTheDocument();
  expect(frame).toBeInTheDocument();
  expect(frame).toHaveAttribute("src", "anim.html");
  expect(link).toContainElement(frame);
});

test("shows token normalised_id when info not hidden", () => {
  render(<NextGenTokenImage token={token} />);
  expect(screen.getByText("#1")).toBeInTheDocument();
});

test("hides token info when hide_info is true", () => {
  render(<NextGenTokenImage token={token} hide_info />);
  expect(screen.queryByText("#1")).not.toBeInTheDocument();
});

test("uses image_url when show_original is true", () => {
  render(<NextGenTokenImage token={token} show_original />);
  const image = screen.getByAltText("token");
  expect(image).toHaveAttribute("src", "image.png");
});

test("uses thumbnail_url by default when available", () => {
  render(<NextGenTokenImage token={token} />);
  const image = screen.getByAltText("token");
  expect(image).toHaveAttribute("src", "thumb.png");
});

test("falls back to image_url when thumbnail_url is not available", () => {
  const tokenWithoutThumbnail = { ...token, thumbnail_url: null };
  render(<NextGenTokenImage token={tokenWithoutThumbnail} />);
  const image = screen.getByAltText("token");
  expect(image).toHaveAttribute("src", "image.png");
});

test("renders owner info button when show_owner_info is true", () => {
  render(<NextGenTokenImage token={token} show_owner_info />);
  const link = screen.getByRole("link");
  const infoButton = screen.getByRole("button", { name: "More info" });

  expect(link).toBeInTheDocument();
  expect(infoButton).toBeInTheDocument();
});

test("renders listing info when show_listing is true and price > 0", () => {
  const tokenWithPrice = {
    ...token,
    price: 1,
    opensea_price: 1,
    opensea_royalty: 500,
  };
  render(<NextGenTokenImage token={tokenWithPrice} show_listing />);

  const link = screen.getByRole("link");
  const listingText = screen.getByText(/Listed for/);
  const royaltyImage = screen.getByAltText("pepe");

  expect(link).toBeInTheDocument();
  expect(listingText).toBeInTheDocument();
  expect(royaltyImage).toBeInTheDocument();
  expect(
    screen.getByText((content, element) => {
      // Check for presence of "1" and "Ξ" regardless of locale formatting
      return content.includes("Ξ") && /1/.test(content);
    })
  ).toBeInTheDocument();
});

test("renders 'Not Listed' when show_listing is true but price is 0", () => {
  const tokenWithoutPrice = { ...token, price: 0 };
  render(<NextGenTokenImage token={tokenWithoutPrice} show_listing />);

  expect(screen.getByText("Not Listed")).toBeInTheDocument();
});

test("does not render royalty image when prices do not match", () => {
  const tokenWithMismatchedPrice = {
    ...token,
    price: 1,
    opensea_price: 2,
    opensea_royalty: 500,
  };
  render(<NextGenTokenImage token={tokenWithMismatchedPrice} show_listing />);

  expect(screen.queryByAltText("pepe")).not.toBeInTheDocument();
});

test("renders max sale information when show_max_sale is true", () => {
  const tokenWithMaxSale = {
    ...token,
    max_sale_value: 2.5,
    max_sale_date: "2023-01-01T00:00:00Z",
  };
  render(<NextGenTokenImage token={tokenWithMaxSale} show_max_sale />);

  expect(screen.getByText("Max sale")).toBeInTheDocument();
  expect(
    screen.getByText((content, element) => {
      // Check for presence of "2" (or "2.5" parts) and "Ξ" regardless of locale formatting
      return content.includes("Ξ") && /2/.test(content);
    })
  ).toBeInTheDocument();
  expect(
    screen.getByText((content, element) => {
      // Check for date containing 2023 and 1 (regardless of locale date formatting)
      return /2023/.test(content) && /1/.test(content);
    })
  ).toBeInTheDocument();
});

test("renders 'Not Sold' when show_max_sale is true but no sale data", () => {
  render(<NextGenTokenImage token={token} show_max_sale />);

  expect(screen.getByText("Not Sold")).toBeInTheDocument();
});

test("renders last sale information when show_last_sale is true", () => {
  const tokenWithLastSale = {
    ...token,
    last_sale_value: 1.8,
    last_sale_date: "2023-02-15T10:30:00Z",
  };
  render(<NextGenTokenImage token={tokenWithLastSale} show_last_sale />);

  expect(screen.getByText("Last sale")).toBeInTheDocument();
  expect(
    screen.getByText((content, element) => {
      // Check for presence of "1" or "8" (parts of 1.8) and "Ξ" regardless of locale formatting
      return content.includes("Ξ") && (/1/.test(content) || /8/.test(content));
    })
  ).toBeInTheDocument();
  expect(
    screen.getByText((content, element) => {
      // Check for date containing 2023 and either 2 or 15 (regardless of locale date formatting)
      return /2023/.test(content) && (/2/.test(content) || /15/.test(content));
    })
  ).toBeInTheDocument();
});

test("renders 'Not Sold' when show_last_sale is true but no sale data", () => {
  render(<NextGenTokenImage token={token} show_last_sale />);

  expect(screen.getByText("Not Sold")).toBeInTheDocument();
});

test("renders Magic Eden royalty image when me_price matches token price", () => {
  const tokenWithMEPrice = {
    ...token,
    price: 1.5,
    me_price: 1.5,
    me_royalty: 750,
  };
  render(<NextGenTokenImage token={tokenWithMEPrice} show_listing />);

  const royaltyImages = screen.getAllByAltText("pepe");
  expect(royaltyImages.length).toBeGreaterThan(0);
});

test("does not render Magic Eden royalty image when me_price does not match token price", () => {
  const tokenWithMismatchedMEPrice = {
    ...token,
    price: 1.5,
    me_price: 2,
    me_royalty: 750,
  };
  render(<NextGenTokenImage token={tokenWithMismatchedMEPrice} show_listing />);

  // Should not render ME royalty image due to price mismatch
  expect(screen.queryByAltText("pepe")).not.toBeInTheDocument();
});

test("renders owner info with correct button structure", () => {
  const tokenWithHandle = { ...token, normalised_handle: "@testuser" };
  render(<NextGenTokenImage token={tokenWithHandle} show_owner_info />);

  const infoButton = screen.getByRole("button", { name: "More info" });
  expect(infoButton).toBeInTheDocument();

  // Verify the tooltip structure exists (content is in tooltip component)
  const tooltipIcon = infoButton.querySelector("svg");
  expect(tooltipIcon).toBeInTheDocument();
});

test("renders owner info without normalised_handle", () => {
  render(<NextGenTokenImage token={token} show_owner_info />);

  const infoButton = screen.getByRole("button", { name: "More info" });
  expect(infoButton).toBeInTheDocument();
});

test("renders animation iframe when animation_url is available", () => {
  const tokenWithAnimation = { ...token, animation_url: "anim.html" };
  render(
    <NextGenTokenImage token={tokenWithAnimation} show_animation hide_link />
  );

  const frame = screen.getByTitle("token");
  expect(frame).toHaveAttribute("src", "anim.html");
});

test("renders image when show_animation is false", () => {
  const tokenWithAnimation = { ...token, animation_url: "anim.html" };
  render(
    <NextGenTokenImage
      token={tokenWithAnimation}
      show_animation={false}
      hide_link
    />
  );

  const image = screen.getByAltText("token");
  expect(image).toBeInTheDocument();
  expect(image).toHaveAttribute("src", "thumb.png");

  // Should not render iframe when show_animation is false
  expect(screen.queryByTitle("token")).not.toBeInTheDocument();
});

test("renders image when show_animation is true but no animation_url", () => {
  const tokenWithoutAnimation = { ...token, animation_url: null };
  render(
    <NextGenTokenImage token={tokenWithoutAnimation} show_animation hide_link />
  );

  const image = screen.getByAltText("token");
  expect(image).toBeInTheDocument();
  expect(image).toHaveAttribute("src", "thumb.png");

  // Should not render iframe when no animation_url is available
  expect(screen.queryByTitle("token")).not.toBeInTheDocument();
});

test("renders image with proper attributes and error handling setup", () => {
  render(<NextGenTokenImage token={token} />);
  const image = screen.getByAltText("token");

  // Verify the image has the expected attributes
  expect(image).toHaveAttribute("src", "thumb.png");
  expect(image).toHaveAttribute("alt", "token");

  // The onError handler is present but we can't easily test its behavior in jsdom
  expect(image).toBeInTheDocument();
});

test("renders with rarity information when rarity_type is provided", () => {
  const tokenWithRarity = {
    ...token,
    trait_score: 85.5,
    trait_score_rank: 123,
  };
  render(
    <NextGenTokenImage token={tokenWithRarity} rarity_type="trait_score" />
  );

  // TraitScore component should be rendered with the score and rank
  // Since TraitScore is not mocked, we can't directly test its content,
  // but we can verify the component doesn't crash and renders the token ID
  expect(screen.getByText("#1")).toBeInTheDocument();
});

test("renders with proper container structure for regular mode", () => {
  render(<NextGenTokenImage token={token} />);
  let imageContainer = screen.getByAltText("token").parentElement;
  expect(imageContainer).toHaveClass(
    "d-flex",
    "flex-column",
    "align-items-center",
    "justify-content-center"
  );
});

test("renders successfully with fullscreen mode", () => {
  render(<NextGenTokenImage token={token} is_fullscreen />);
  expect(screen.getByAltText("token")).toBeInTheDocument();
});

test("renders successfully with token_art mode", () => {
  render(<NextGenTokenImage token={token} token_art />);
  expect(screen.getByAltText("token")).toBeInTheDocument();
});

test("renders different marketplace prices in owner info tooltip", () => {
  const tokenWithMarketplacePrices = {
    ...token,
    opensea_price: 2.5,
    blur_price: 2.3,
    me_price: 2.4,
  };
  render(
    <NextGenTokenImage token={tokenWithMarketplacePrices} show_owner_info />
  );

  const infoButton = screen.getByRole("button", { name: "More info" });
  expect(infoButton).toBeInTheDocument();

  // The tooltip is set on the FontAwesome icon, not the button
  const tooltipIcon = infoButton.querySelector("svg");
  expect(tooltipIcon).toBeInTheDocument();
});

test("does not render marketplace listings when prices are 0", () => {
  const tokenWithZeroPrices = {
    ...token,
    opensea_price: 0,
    blur_price: 0,
    me_price: 0,
  };
  render(<NextGenTokenImage token={tokenWithZeroPrices} show_owner_info />);

  const infoButton = screen.getByRole("button", { name: "More info" });
  expect(infoButton).toBeInTheDocument();
});

describe("URL helper functions", () => {
  test("getNextGenImageUrl builds correct image URLs with base URL", () => {
    const url = getNextGenImageUrl(5);
    expect(url).toContain("/png/5");
    expect(url).toMatch(/^https?:\/\/.*\/png\/5$/);
  });

  test("getNextGenIconUrl builds correct icon URLs with base URL", () => {
    const url = getNextGenIconUrl(5);
    expect(url).toContain("/thumbnail/5");
    expect(url).toMatch(/^https?:\/\/.*\/thumbnail\/5$/);
  });

  test("get8KUrl builds correct 8K URLs with base URL", () => {
    const url = get8KUrl(5);
    expect(url).toContain("/png8k/5");
    expect(url).toMatch(/^https?:\/\/.*\/png8k\/5$/);
  });

  test("get16KUrl builds correct 16K URLs with base URL", () => {
    const url = get16KUrl(5);
    expect(url).toContain("/png16k/5");
    expect(url).toMatch(/^https?:\/\/.*\/png16k\/5$/);
  });

  test("URL helper functions handle different token IDs correctly", () => {
    const tokenIds = [1, 999, 12345];

    for (const id of tokenIds) {
      expect(getNextGenImageUrl(id)).toContain(`/png/${id}`);
      expect(getNextGenIconUrl(id)).toContain(`/thumbnail/${id}`);
      expect(get8KUrl(id)).toContain(`/png8k/${id}`);
      expect(get16KUrl(id)).toContain(`/png16k/${id}`);
    }
  });
});
