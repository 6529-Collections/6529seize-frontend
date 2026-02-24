import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemesSubmissionPreviewScreen } from "@/components/waves/memes/submission/preview/MemesSubmissionPreviewScreen";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("@/components/memes/drops/MemesLeaderboardDrop", () => ({
  MemesLeaderboardDrop: () => <div data-testid="preview-list-card" />,
}));

jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem",
  () => ({
    WaveLeaderboardGalleryItem: () => (
      <div data-testid="preview-gallery-card" />
    ),
  })
);

jest.mock("@/components/utils/button/SecondaryButton", () => (props: any) => (
  <button onClick={props.onClicked} disabled={props.disabled}>
    {props.children}
  </button>
));

jest.mock("@/components/utils/button/PrimaryButton", () => (props: any) => (
  <button
    onClick={props.onClicked}
    disabled={props.disabled || props.loading}
    data-padding={props.padding}
  >
    {props.children}
  </button>
));

describe("MemesSubmissionPreviewScreen", () => {
  const previewDrop = { id: "drop-1" } as any;

  it("renders isolated preview cases in the expected order", () => {
    render(
      <MemesSubmissionPreviewScreen
        previewDrop={previewDrop}
        onBackToEdit={jest.fn()}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Submission Preview" })
    ).toBeInTheDocument();

    const caseTitles = screen
      .getAllByRole("heading", { level: 5 })
      .map((heading) => heading.textContent?.trim());

    expect(caseTitles).toEqual([
      "Leaderboard List Card",
      "Leaderboard Gallery Card",
    ]);

    expect(screen.getByTestId("preview-list-card")).toBeInTheDocument();
    expect(screen.getByTestId("preview-gallery-card")).toBeInTheDocument();
  });

  it("keeps footer actions wired", async () => {
    const user = userEvent.setup();
    const onBackToEdit = jest.fn();
    const onSubmit = jest.fn();

    render(
      <MemesSubmissionPreviewScreen
        previewDrop={previewDrop}
        onBackToEdit={onBackToEdit}
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    );

    await user.click(screen.getByRole("button", { name: "Back to Edit" }));
    await user.click(screen.getByRole("button", { name: "Submit Artwork" }));

    expect(onBackToEdit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
