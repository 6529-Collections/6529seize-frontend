import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

let capturedQuoteProps: any;
jest.mock("@/components/waves/drops/WaveDropQuote", () => (props: any) => {
  capturedQuoteProps = props;
  return <div data-testid="quote">{props.drop ? props.drop.id : "none"}</div>;
});

const useQueryMock = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any) => useQueryMock(...args),
}));

import WaveDropQuoteWithSerialNo from "@/components/waves/drops/WaveDropQuoteWithSerialNo";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

describe("WaveDropQuoteWithSerialNo", () => {
  beforeEach(() => {
    capturedQuoteProps = undefined;
    useQueryMock.mockReset();
  });

  it("fetches drop by serial number and renders quote", async () => {
    useQueryMock.mockReturnValue({
      data: { id: "d1", serial_no: 5, hide_link_preview: true },
    });

    render(
      <WaveDropQuoteWithSerialNo
        serialNo={5}
        waveId="w"
        onQuoteClick={jest.fn()}
      />
    );

    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: [
        QueryKey.DROP,
        "wave-drop-quote-serial",
        {
          waveId: "w",
          serialNo: 5,
        },
      ],
      queryFn: expect.any(Function),
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote")).toHaveTextContent("d1");
    });
    expect(capturedQuoteProps.hideLinkPreviews).toBeTruthy();
  });
});
