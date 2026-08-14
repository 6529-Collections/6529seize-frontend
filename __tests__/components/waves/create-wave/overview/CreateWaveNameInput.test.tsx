import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveNameInput from "@/components/waves/create-wave/overview/CreateWaveNameInput";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

beforeAll(() => {
  // Mock ResizeObserver used in CommonAnimationHeight
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("CreateWaveNameInput", () => {
  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CreateWaveNameInput name="" errors={[]} onChange={onChange} />);
    await user.type(screen.getByLabelText("Wave Name *"), "Wave");
    expect(onChange).toHaveBeenCalled();
  });

  it("keeps the wave name label inside the input until it floats", () => {
    render(<CreateWaveNameInput name="" errors={[]} onChange={jest.fn()} />);

    const input = screen.getByLabelText("Wave Name *");
    const label = screen.getByText(/Wave Name/, { selector: "label" });

    expect(input).toHaveAttribute("placeholder", " ");
    expect(label).toHaveClass("peer-placeholder-shown:tw-top-1/2");
    expect(label).toHaveClass("peer-focus:tw-scale-75");
  });

  it("shows error message when name required", () => {
    render(
      <CreateWaveNameInput
        name=""
        errors={[CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });
});
