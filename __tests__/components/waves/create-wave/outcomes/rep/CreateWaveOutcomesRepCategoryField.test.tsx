import { render } from "@testing-library/react";
import CreateWaveOutcomesRepCategoryField from "@/components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRepCategoryField";

let repCategoryProps: Record<string, unknown> | undefined;

jest.mock(
  "@/components/utils/input/rep-category/RepCategorySearch",
  () =>
    function RepCategorySearch(props: Record<string, unknown>) {
      repCategoryProps = props;
      return <input aria-label="Rep Category" />;
    }
);

describe("CreateWaveOutcomesRepCategoryField", () => {
  it("does not let normal-state classes override the error state", () => {
    const setCategory = jest.fn();
    const { rerender } = render(
      <CreateWaveOutcomesRepCategoryField
        category={null}
        errorMessage={null}
        setCategory={setCategory}
      />
    );

    expect(repCategoryProps?.["inputClassName"]).toContain("tw-ring-white/5");

    rerender(
      <CreateWaveOutcomesRepCategoryField
        category={null}
        errorMessage="Choose a Rep category"
        setCategory={setCategory}
      />
    );

    expect(repCategoryProps?.["error"]).toBe(true);
    expect(repCategoryProps?.["inputClassName"]).toBeUndefined();
  });
});
