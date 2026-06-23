import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtworkDetails from "@/components/waves/memes/submission/details/ArtworkDetails";

describe("ArtworkDetails", () => {
  it("calls blur handlers when values change", async () => {
    const user = userEvent.setup();
    const onTitleChange = jest.fn();
    const onDescriptionChange = jest.fn();
    const onTitleBlur = jest.fn();
    const onDescriptionBlur = jest.fn();
    render(
      <ArtworkDetails
        title="old"
        description="desc"
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
        onTitleBlur={onTitleBlur}
        onDescriptionBlur={onDescriptionBlur}
      />
    );
    const title = screen.getByLabelText(/Artwork Title/);
    const desc = screen.getByLabelText(/Description/);
    await user.clear(title);
    await user.type(title, "new");
    await user.tab();
    expect(onTitleChange).toHaveBeenCalledWith("new");
    expect(onTitleBlur).toHaveBeenCalled();
    await user.clear(desc);
    await user.type(desc, "text");
    await user.tab();
    expect(onDescriptionChange).toHaveBeenCalledWith("text");
    expect(onDescriptionBlur).toHaveBeenCalled();
  });

  it("syncs input values when props change", () => {
    const { rerender } = render(
      <ArtworkDetails
        title="one"
        description="two"
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );
    const title = screen.getByLabelText(/Artwork Title/) as HTMLInputElement;
    expect(title.value).toBe("one");
    rerender(
      <ArtworkDetails
        title="three"
        description="two"
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );
    expect(title.value).toBe("three");
  });

  it("applies metadata-specific title and description length limits", () => {
    render(
      <ArtworkDetails
        title=""
        description=""
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );

    expect(screen.getByLabelText(/Artwork Title/)).toHaveAttribute(
      "maxLength",
      "255"
    );
    expect(screen.getByLabelText(/Description/)).toHaveAttribute(
      "data-max-length",
      "8000"
    );
    expect(screen.getByLabelText(/Description/)).not.toHaveAttribute(
      "maxLength"
    );
  });

  it("limits description input to 8000 JavaScript characters", () => {
    const onDescriptionChange = jest.fn();

    render(
      <ArtworkDetails
        title=""
        description=""
        onTitleChange={() => {}}
        onDescriptionChange={onDescriptionChange}
      />
    );

    const description = screen.getByLabelText(
      /Description/
    ) as HTMLTextAreaElement;
    const text = `${"a".repeat(7999)}\nextra`;

    fireEvent.input(description, { target: { value: text } });

    expect(description.value).toHaveLength(8000);
    expect(onDescriptionChange).toHaveBeenLastCalledWith(text.slice(0, 8000));
  });

  it("shows title and description character counts", () => {
    render(
      <ArtworkDetails
        title="abc"
        description={"line one\nline two"}
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );

    expect(screen.getByText("3 / 255")).toBeInTheDocument();
    expect(screen.getByText("17 / 8,000")).toBeInTheDocument();
  });

  it("uses warning, danger, and limit colors for character counts", () => {
    const { rerender } = render(
      <ArtworkDetails
        title={"t".repeat(230)}
        description=""
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );

    expect(screen.getByText("230 / 255")).toHaveClass("tw-text-amber-400");

    rerender(
      <ArtworkDetails
        title={"t".repeat(245)}
        description=""
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );

    expect(screen.getByText("245 / 255")).toHaveClass("tw-text-orange-400");

    rerender(
      <ArtworkDetails
        title={"t".repeat(255)}
        description=""
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );

    expect(screen.getByText("255 / 255")).toHaveClass("tw-text-red");

    rerender(
      <ArtworkDetails
        title=""
        description={"d".repeat(7600)}
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );

    expect(screen.getByText("7,600 / 8,000")).toHaveClass("tw-text-orange-400");
  });

  it("uses neutral required markers and subtle success rings for filled fields", () => {
    render(
      <ArtworkDetails
        title="Filled title"
        description="Filled description"
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
        showRequiredMarkers={true}
      />
    );

    const requiredMarkers = screen.getAllByText("*");
    requiredMarkers.forEach((marker) => {
      expect(marker).toHaveClass("tw-text-iron-500");
    });

    expect(screen.getByLabelText(/Artwork Title/)).toHaveClass(
      "tw-ring-emerald-600/45"
    );
    expect(screen.getByLabelText(/Description/)).toHaveClass(
      "tw-ring-emerald-600/45"
    );
  });

  it("hides the additional action promise checkbox by default", () => {
    render(
      <ArtworkDetails
        title=""
        description=""
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
      />
    );

    expect(
      screen.queryByRole("checkbox", {
        name: /additional action/i,
      })
    ).not.toBeInTheDocument();
  });

  it("renders and toggles the additional action promise checkbox when enabled", async () => {
    const user = userEvent.setup();
    const onAdditionalActionPromisedChange = jest.fn();

    render(
      <ArtworkDetails
        title=""
        description=""
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
        showAdditionalActionPromised={true}
        isAdditionalActionPromised={false}
        onAdditionalActionPromisedChange={onAdditionalActionPromisedChange}
      />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /additional action/i,
    });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(onAdditionalActionPromisedChange).toHaveBeenCalledWith(true);
  });
});
