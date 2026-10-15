import { render } from "@testing-library/react";

import ErrorComponent from "@/components/error/Error";

// Regression for the root crash fallback: app/global-error.tsx used to render
// this component. global-error replaces the root layout, so no TitleProvider
// exists there and the fallback threw while rendering the crash screen. Keep
// this as the reason app/global-error.tsx must stay self-contained.
describe("ErrorComponent without app providers", () => {
  it("throws because useTitle requires a TitleProvider", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      expect(() => render(<ErrorComponent onReset={jest.fn()} />)).toThrow(
        "useTitle must be used within a TitleProvider"
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
