import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDraftsSection from "@/components/waves/create-wave/overview/CreateWaveDraftsSection";
import type { CreateWaveDraft } from "@/helpers/waves/create-wave-draft.helpers";

jest.mock("@/helpers/Helpers", () => ({
  getTimeAgo: () => "1 hour ago",
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/common/CollapsibleCard", () => {
  const MockCollapsibleCard = (props: {
    readonly title: ReactNode;
    readonly titleActions?: ReactNode;
    readonly isExpanded: boolean;
    readonly onToggle: () => void;
    readonly children: ReactNode;
  }) => (
    <div data-testid="card" data-expanded={String(props.isExpanded)}>
      <button type="button" data-testid="toggle" onClick={props.onToggle}>
        {props.title}
        {props.titleActions}
      </button>
      {props.isExpanded ? props.children : null}
    </div>
  );
  MockCollapsibleCard.displayName = "MockCollapsibleCard";
  return MockCollapsibleCard;
});

const makeDraft = (id: string, name: string): CreateWaveDraft =>
  ({
    id,
    updatedAt: 1_700_000_000_000,
    config: { overview: { name } },
    endDateConfig: null,
  }) as unknown as CreateWaveDraft;

describe("CreateWaveDraftsSection", () => {
  it("renders nothing when there are no drafts", () => {
    const { container } = render(
      <CreateWaveDraftsSection
        drafts={[]}
        onLoad={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the saved-draft count and reveals each draft once expanded", () => {
    render(
      <CreateWaveDraftsSection
        drafts={[makeDraft("a", "Alpha"), makeDraft("b", "")]}
        onLoad={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    // Collapsed by default, but the count badge is always in the header.
    expect(screen.getByTestId("card")).toHaveAttribute("data-expanded", "false");
    expect(screen.getByLabelText("2 saved drafts")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("toggle"));

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    // The empty-named draft falls back to the "Untitled wave" label.
    expect(screen.getByText("Untitled wave")).toBeInTheDocument();
  });

  it("loads the selected draft and collapses the list", () => {
    const onLoad = jest.fn();
    render(
      <CreateWaveDraftsSection
        drafts={[makeDraft("a", "Alpha")]}
        onLoad={onLoad}
        onDelete={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("toggle")); // expand
    fireEvent.click(screen.getByText("Alpha")); // select the draft

    expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(screen.getByTestId("card")).toHaveAttribute(
      "data-expanded",
      "false"
    );
  });

  it("deletes a draft by id without loading it", () => {
    const onLoad = jest.fn();
    const onDelete = jest.fn();
    render(
      <CreateWaveDraftsSection
        drafts={[makeDraft("a", "Alpha")]}
        onLoad={onLoad}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByTestId("toggle")); // expand
    fireEvent.click(screen.getByRole("button", { name: 'Delete draft "Alpha"' }));

    expect(onDelete).toHaveBeenCalledWith("a");
    expect(onLoad).not.toHaveBeenCalled();
  });
});
