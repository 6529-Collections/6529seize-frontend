import { render, screen } from "@testing-library/react";
import CreateDropStormView from "@/components/drops/create/utils/storm/CreateDropStormView";
import type { CreateDropConfig } from "@/entities/IDrop";

jest.mock(
  "@/components/drops/create/utils/storm/CreateDropStormViewPart",
  () => {
    const React = require("react");

    return jest.fn(
      ({
        part,
      }: {
        part: {
          readonly clientId?: string;
          readonly id?: string | number;
          readonly content?: string | null;
        };
      }) => {
        const initialClientId = React.useRef(
          part.clientId ?? String(part.id)
        ).current;

        return (
          <div data-initial-client-id={initialClientId} data-testid="part">
            {part.content}
          </div>
        );
      }
    );
  }
);

const MockPart = require("@/components/drops/create/utils/storm/CreateDropStormViewPart");

describe("CreateDropStormView", () => {
  const profile = { id: "1", handle: "alice", pfp: null } as any;
  const wave = { name: "Wave", image: null, id: "wave1" };

  function createDropWithParts(count: number): CreateDropConfig {
    return {
      parts: Array.from({ length: count }, (_, index) => ({
        clientId: `part-${index}`,
        content: `content ${index}`,
        quoted_drop: null,
        media: [new File([""], "a.png", { type: "image/png" })],
      })),
      referenced_nfts: [],
      mentioned_users: [],
      title: "title",
    } as any;
  }

  afterEach(() => {
    (MockPart as jest.Mock).mockClear();
  });

  it("renders a part component for each drop part", () => {
    const drop = createDropWithParts(2);
    render(
      <CreateDropStormView
        drop={drop}
        profile={profile}
        wave={wave}
        removePart={jest.fn()}
      />
    );
    expect(screen.getAllByTestId("part")).toHaveLength(2);
    expect(MockPart).toHaveBeenCalledTimes(2);
  });

  it("renders nothing when there are no parts", () => {
    const drop = createDropWithParts(0);
    render(
      <CreateDropStormView
        drop={drop}
        profile={profile}
        wave={wave}
        removePart={jest.fn()}
      />
    );
    expect(screen.queryByTestId("part")).toBeNull();
  });

  it("passes disabled state to storm parts", () => {
    const drop = createDropWithParts(1);
    render(
      <CreateDropStormView
        drop={drop}
        profile={profile}
        wave={wave}
        disabled
        removePart={jest.fn()}
      />
    );
    expect((MockPart as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({ disabled: true })
    );
  });

  it("keeps the remaining part tied to its stable client id after removal", () => {
    const drop = createDropWithParts(2);
    const { rerender } = render(
      <CreateDropStormView
        drop={drop}
        profile={profile}
        wave={wave}
        removePart={jest.fn()}
      />
    );

    rerender(
      <CreateDropStormView
        drop={{ ...drop, parts: [drop.parts[1]] }}
        profile={profile}
        wave={wave}
        removePart={jest.fn()}
      />
    );

    const remainingPart = screen.getByTestId("part");
    expect(remainingPart).toHaveTextContent("content 1");
    expect(remainingPart).toHaveAttribute("data-initial-client-id", "part-1");
  });
});
