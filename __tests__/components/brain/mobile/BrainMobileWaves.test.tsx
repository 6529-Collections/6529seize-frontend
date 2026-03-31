import { fireEvent, render, screen } from "@testing-library/react";
import BrainMobileWaves from "@/components/brain/mobile/BrainMobileWaves";

let receivedRef: any;

jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaves",
  () => ({
    __esModule: true,
    default: ({ scrollContainerRef }: any) => {
      receivedRef = scrollContainerRef;
      return <div data-testid="waves" />;
    },
  })
);

jest.mock("@/components/brain/left-sidebar/waves/MemesWaveFooter", () => ({
  __esModule: true,
  default: ({ onOpenQuickVote }: { readonly onOpenQuickVote: () => void }) => (
    <button type="button" data-testid="footer" onClick={onOpenQuickVote}>
      footer
    </button>
  ),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ mobileWavesViewStyle: { height: "42px" } }),
}));

test("applies style, forwards scroll ref, and passes the quick-vote opener", () => {
  const onOpenQuickVote = jest.fn();
  const { container } = render(
    <BrainMobileWaves onOpenQuickVote={onOpenQuickVote} />
  );

  expect((container.firstChild as HTMLElement).style.height).toBe("42px");
  expect(receivedRef).toBeDefined();
  expect(receivedRef.current).not.toBe(container.firstChild);
  expect(receivedRef.current).toContainElement(screen.getByTestId("waves"));

  fireEvent.click(screen.getByTestId("footer"));

  expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
});
