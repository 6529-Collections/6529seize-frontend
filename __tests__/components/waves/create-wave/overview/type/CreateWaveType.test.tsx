import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveType from "@/components/waves/create-wave/overview/type/CreateWaveType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock(
  "@/components/waves/create-wave/overview/type/CreateWaveTypeInputs",
  () => (props: any) => (
    <button
      data-testid="inputs"
      onClick={() => props.onChange(ApiWaveType.Rank)}
    >
      inputs
    </button>
  )
);

describe("CreateWaveType", () => {
  it.each([false, true])(
    "renders and handles selection in subwave=%s",
    async (isSubwave) => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <CreateWaveType
          isSubwave={isSubwave}
          selected={ApiWaveType.Chat}
          onChange={onChange}
        />
      );
      await user.click(screen.getByTestId("inputs"));
      expect(onChange).toHaveBeenCalledWith(ApiWaveType.Rank);
      expect(
        screen.getByText(isSubwave ? "Subwave Type" : "Wave Type")
      ).toBeInTheDocument();
    }
  );
});
