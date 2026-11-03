import { render, screen } from "@testing-library/react";
import React from "react";
import DropPart from "@/components/drops/view/part/DropPart";
import { useRouter } from "next/navigation";

jest.mock("@/components/drops/create/utils/DropPfp", () => ({
  __esModule: true,
  default: () => <span data-testid="author-avatar" />,
}));

const DropPartContentMock = jest.fn(() => null);
jest.mock(
  "@/components/drops/view/part/DropPartContent",
  () => (props: any) => {
    DropPartContentMock(props);
    return <div data-testid="content" />;
  }
);

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn().mockReturnValue(null),
  })),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const drop = {
  wave: { id: "w", name: "Wave" },
  serial_no: 1,
} as any;

const profile = { handle: "alice", pfp: null } as any;

describe("DropPart", () => {
  it.each([false, true])(
    "suppresses identifying imagery only when is_anonymous is %s",
    (isAnonymous) => {
      render(
        <DropPart
          profile={{
            ...profile,
            pfp: "https://example.com/alice.jpg",
            is_anonymous: isAnonymous,
          }}
          mentionedUsers={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          partContent="text"
          partMedias={[]}
          dropTitle={null}
          createdAt={1}
          wave={drop.wave}
          smallMenuIsShown={false}
        />
      );
      expect(screen.queryByTestId("author-avatar") !== null).toBe(!isAnonymous);
    }
  );
  it("passes onQuoteClick to content", () => {
    render(
      <DropPart
        profile={profile}
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent="text"
        partMedias={[]}
        dropTitle={null}
        createdAt={1}
        wave={drop.wave}
        smallMenuIsShown={false}
      />
    );
    const fn = DropPartContentMock.mock.calls[0][0]?.onQuoteClick;
    fn(drop as any);
    const router = (useRouter as jest.Mock).mock.results[0]?.value;
    expect(router.push).toHaveBeenCalledWith("/waves/w?serialNo=1", {
      scroll: false,
    });
  });
});
