import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckFilters from "@/app/content-moderation/checks/CheckFilters";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const applied = jest.fn();
function Harness({ initial = "" }: { readonly initial?: string }) {
  const [params, setParams] = useState(() => new URLSearchParams(initial));
  return (
    <CheckFilters
      params={params}
      onApply={(next) => {
        applied(next);
        setParams(next);
      }}
    />
  );
}

beforeEach(() => applied.mockClear());

it("applies only the review-status toggle immediately and keeps advanced filters closed", async () => {
  render(<Harness initial="outcome=ALLOW&from=2026-10-01&profile_id=author" />);
  const toggle = screen.getByRole("switch", { name: "Needs review only" });
  const disclosure = screen.getByRole("button", { name: "Filter checks" });
  await userEvent.click(toggle);
  expect(toggle).toBeChecked();
  expect(Object.fromEntries(applied.mock.lastCall![0])).toEqual({
    outcome: "ALLOW",
    from: "2026-10-01",
    profile_id: "author",
    review_status: "NEEDS_REVIEW",
  });
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("combobox", { name: "Review status" })
  ).not.toBeInTheDocument();
  await userEvent.click(toggle);
  expect(toggle).not.toBeChecked();
  expect(applied.mock.lastCall![0].has("review_status")).toBe(false);
  expect(applied.mock.lastCall![0].get("outcome")).toBe("ALLOW");
});

it("waits for Apply filters before synchronizing the toggle with advanced review status", async () => {
  render(<Harness initial="review_status=NEEDS_REVIEW" />);
  await userEvent.click(screen.getByRole("button", { name: "Filter checks" }));
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Review status" }),
    "REVIEWED"
  );
  expect(screen.getByRole("switch")).toBeChecked();
  expect(applied).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("Unapplied changes");
  await userEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(screen.getByRole("switch")).not.toBeChecked();
  expect(applied.mock.lastCall![0].get("review_status")).toBe("REVIEWED");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Filter checks" })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Review status" }),
    "NEEDS_REVIEW"
  );
  await userEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(screen.getByRole("switch")).toBeChecked();
});

it("preserves pending advanced edits while toggling only the applied review status", async () => {
  render(<Harness initial="outcome=ALLOW" />);
  await userEvent.click(screen.getByRole("button", { name: "Filter checks" }));
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Check outcome" }),
    "REJECT"
  );
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Review status" }),
    "REVIEWED"
  );
  await userEvent.click(screen.getByRole("switch"));
  expect(applied.mock.lastCall![0].get("outcome")).toBe("ALLOW");
  expect(applied.mock.lastCall![0].get("review_status")).toBe("NEEDS_REVIEW");
  expect(screen.getByRole("combobox", { name: "Check outcome" })).toHaveValue(
    "REJECT"
  );
  expect(screen.getByRole("combobox", { name: "Review status" })).toHaveValue(
    "NEEDS_REVIEW"
  );
  expect(screen.getByRole("status")).toHaveTextContent("Unapplied changes");
  await userEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(applied.mock.lastCall![0].get("outcome")).toBe("REJECT");
  expect(screen.getByRole("switch")).toBeChecked();
});

it("retains drafts when collapsed and clears both drafts and applied filters explicitly", async () => {
  render(<Harness initial="review_status=NEEDS_REVIEW" />);
  const disclosure = screen.getByRole("button", { name: "Filter checks" });
  await userEvent.click(disclosure);
  await userEvent.type(screen.getByLabelText("Profile ID"), "author");
  await userEvent.click(disclosure);
  expect(screen.getByRole("status")).toBeVisible();
  await userEvent.click(disclosure);
  expect(screen.getByLabelText("Profile ID")).toHaveValue("author");
  await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByLabelText("Profile ID")).toHaveValue("");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("switch")).not.toBeChecked();
  expect(applied.mock.lastCall![0].toString()).toBe("");
  expect(disclosure).toHaveAttribute("aria-expanded", "true");
});

it("recovers from an invalid date range when either boundary is corrected", async () => {
  render(<Harness />);
  await userEvent.click(screen.getByRole("button", { name: "Filter checks" }));
  const from = screen.getByLabelText("From date (UTC)");
  const to = screen.getByLabelText("To date (UTC)") as HTMLInputElement;
  fireEvent.change(from, { target: { value: "2026-10-20" } });
  fireEvent.change(to, { target: { value: "2026-10-10" } });
  await userEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(applied).not.toHaveBeenCalled();
  expect(to.validity.customError).toBe(true);
  fireEvent.change(from, { target: { value: "2026-10-01" } });
  expect(to.validity.customError).toBe(false);
  await userEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(applied.mock.lastCall![0].get("from")).toBe("2026-10-01");
});
