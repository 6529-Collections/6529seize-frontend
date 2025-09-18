import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import InstagramCard from "../../../components/waves/InstagramCard";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("InstagramCard", () => {
  const basePreview = {
    canonicalUrl: "https://instagram.com/p/abc/",
    resource: "post" as const,
    status: "available" as const,
  };

  it("renders media posts with caption toggle and actions", async () => {
    const caption = `Line one\n${"caption content ".repeat(20)}`;

    render(
      <InstagramCard
        href="https://www.instagram.com/p/abc/?utm_source=test"
        preview={{
          ...basePreview,
          authorName: "Test Creator",
          username: "creator",
          caption,
          thumbnailUrl: "https://cdninstagram.com/media.jpg",
          thumbnailWidth: 1080,
          thumbnailHeight: 1350,
          uploadDate: "2023-09-01T12:00:00.000Z",
        }}
      />
    );

    expect(screen.getByTestId("instagram-card")).toBeInTheDocument();
    expect(screen.getByText("@creator")).toBeInTheDocument();
    expect(screen.getByText("Test Creator")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open this instagram post/i })
    ).toHaveAttribute("href", "https://instagram.com/p/abc/");

    const toggle = screen.getByRole("button", { name: /show more/i });
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: /show less/i })).toBeInTheDocument();
  });

  it("shows video badge for reels", () => {
    render(
      <InstagramCard
        href="https://www.instagram.com/reel/xyz/"
        preview={{
          ...basePreview,
          canonicalUrl: "https://instagram.com/reel/xyz/",
          resource: "reel",
          status: "available",
          thumbnailUrl: "https://cdninstagram.com/video.jpg",
          thumbnailWidth: 720,
          thumbnailHeight: 1280,
        }}
      />
    );

    expect(screen.getByText("Reel")).toBeInTheDocument();
  });

  it("renders profile cards with profile-specific action", () => {
    render(
      <InstagramCard
        href="https://www.instagram.com/artist/"
        preview={{
          canonicalUrl: "https://instagram.com/artist/",
          resource: "profile",
          status: "available",
          username: "artist",
          authorName: "Artist Name",
        }}
      />
    );

    expect(screen.getByTestId("instagram-card-profile")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open instagram profile/i })
    ).toHaveTextContent("Open profile");
  });

  it("renders unavailable state for protected content", () => {
    render(
      <InstagramCard
        href="https://www.instagram.com/stories/user/123/"
        preview={{
          canonicalUrl: "https://instagram.com/stories/user/123/",
          resource: "story",
          status: "protected",
          username: "user",
        }}
      />
    );

    expect(screen.getByTestId("instagram-card-unavailable")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open this instagram story by @user/i })
    ).toHaveAttribute("href", "https://instagram.com/stories/user/123/");
  });
});
