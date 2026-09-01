import { render, screen } from "@testing-library/react";
import GroupCardView from "@/components/groups/page/list/card/GroupCardView";

const HeaderMock = jest.fn(() => <div data-testid="header" />);
const ContentMock = jest.fn(() => <div data-testid="content" />);
const CreatorMock = jest.fn(() => <div data-testid="creator" />);

jest.mock(
  "@/components/groups/page/list/card/GroupCardHeader",
  () => (props: any) => HeaderMock(props)
);
jest.mock(
  "@/components/groups/page/list/card/GroupCardContent",
  () => (props: any) => ContentMock(props)
);
jest.mock(
  "@/components/groups/page/list/card/GroupCardCreator",
  () => (props: any) => CreatorMock(props)
);

describe("GroupCardView", () => {
  it("renders title, details, then the creator footer", () => {
    const group: any = { id: "g" };
    render(<GroupCardView group={group} titlePlaceholder="Loading group" />);
    expect(HeaderMock).toHaveBeenCalledWith(
      expect.objectContaining({ group, titlePlaceholder: "Loading group" })
    );
    expect(ContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ group })
    );
    expect(ContentMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ titlePlaceholder: expect.anything() })
    );
    expect(CreatorMock).toHaveBeenCalledWith(
      expect.objectContaining({ group })
    );

    const header = screen.getByTestId("header");
    const content = screen.getByTestId("content");
    const creator = screen.getByTestId("creator");
    expect(
      header.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      content.compareDocumentPosition(creator) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
