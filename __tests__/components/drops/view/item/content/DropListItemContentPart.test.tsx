import { render, screen } from "@testing-library/react";
import DropListItemContentPart from "@/components/drops/view/item/content/DropListItemContentPart";
import { DropContentPartType } from "@/components/drops/view/part/DropPartMarkdown";

jest.mock(
  "@/components/drops/view/item/content/nft-tag/DropListItemContentNft",
  () => (props: any) => <div data-testid="nft">{props.nft.id}</div>
);

jest.mock(
  "@/components/drops/view/item/content/DropListItemContentMention",
  () => (props: any) => <div data-testid="mention">{props.user.handle}</div>
);

jest.mock(
  "@/components/drops/view/item/content/DropListItemContentWaveMention",
  () => (props: any) => (
    <div data-testid="wave-mention">{props.wave.wave_name_in_content}</div>
  )
);

describe("DropListItemContentPart", () => {
  it("renders mention", () => {
    render(
      <DropListItemContentPart
        part={{
          type: DropContentPartType.MENTION,
          value: { handle: "bob" } as any,
          match: "",
        }}
      />
    );
    expect(screen.getByTestId("mention")).toHaveTextContent("bob");
  });

  it("renders nft", () => {
    render(
      <DropListItemContentPart
        part={{
          type: DropContentPartType.HASHTAG,
          value: { id: "1" } as any,
          match: "",
        }}
      />
    );
    expect(screen.getByTestId("nft")).toHaveTextContent("1");
  });

  it("renders wave mention", () => {
    render(
      <DropListItemContentPart
        part={{
          type: DropContentPartType.WAVE_MENTION,
          value: { wave_name_in_content: "Wave One" } as any,
          match: "",
        }}
      />
    );
    expect(screen.getByTestId("wave-mention")).toHaveTextContent("Wave One");
  });
});
