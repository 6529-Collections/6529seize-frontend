import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { E2eeSearchPanel } from "@/components/e2ee/conversation/E2eeSearchPanel";
import {
  conversation,
  createFakeE2eeEngine,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

it("keeps broad result lists bounded and cancels obsolete searches", async () => {
  const engine = createFakeE2eeEngine();
  const rows = Array.from({ length: 123 }, (_, i) =>
    message({ id: `result-${i}`, text: `match ${i}` })
  );
  const search = jest.spyOn(engine, "search").mockResolvedValue(rows);
  const jump = jest.fn();
  const { unmount } = render(
    <E2eeSearchPanel
      engine={engine}
      conversation={conversation()}
      selfProfileId={SELF_ID}
      onClose={jest.fn()}
      onJumpTo={jump}
    />
  );
  const input = screen.getByRole("searchbox");
  fireEvent.change(input, { target: { value: "match" } });
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("123 results")
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(50);
  expect(
    screen.getByRole("button", { name: "Previous results" })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Next results" }));
  fireEvent.click(screen.getByText("match 50"));
  expect(jump).toHaveBeenCalledWith("result-50");
  expect(screen.getAllByRole("listitem")).toHaveLength(50);
  fireEvent.click(screen.getByRole("button", { name: "Next results" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(23);
  expect(screen.getByRole("button", { name: "Next results" })).toBeDisabled();
  const signal = search.mock.calls[0]?.[2];
  expect(signal?.aborted).toBe(false);
  fireEvent.change(input, { target: { value: "another" } });
  expect(signal?.aborted).toBe(true);
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  unmount();
});
