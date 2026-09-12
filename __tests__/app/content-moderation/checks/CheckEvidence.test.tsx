import CheckEvidence from "@/app/content-moderation/checks/CheckEvidence";
import {
  checkAuditActionLabel,
  checkValueLabel,
  readCheckFilters,
} from "@/app/content-moderation/checks/checks.helpers";
import { render, screen } from "@testing-library/react";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("labels known audit actions and operations while preserving future diagnostic identifiers", () => {
  expect(checkAuditActionLabel("en-US", "SUSPEND")).toBe(
    "Suspend author posting"
  );
  expect(checkValueLabel("en-US", "UPDATE")).toBe("Update");
  expect(checkAuditActionLabel("en-US", "FUTURE_DIAGNOSTIC")).toBe(
    "FUTURE_DIAGNOSTIC"
  );
});

it("renders flagged content as inert text with no automatic image or embedded content", () => {
  const evidence = {
    text: "<script>alert(1)</script>",
    media: "https://example.org/file.png",
    bad: "javascript:alert(1)",
    credentials: "https://user:pass@example.org/",
    data: "data:text/html,hi",
  };
  const { container } = render(<CheckEvidence evidence={evidence} />);
  expect(container.querySelector("script, img, video, iframe")).toBeNull();
  expect(container.textContent).toContain("<script>alert(1)</script>");
  const link = screen.getByRole("link", { hidden: true });
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(screen.getAllByRole("link", { hidden: true })).toHaveLength(1);
  expect(link).toHaveAttribute("href", "https://example.org/file.png");
});

it("only accepts typed filters, exact IDs, and UTC date boundaries", () => {
  const filters = readCheckFilters(
    new URLSearchParams({
      subject_type: "DROP",
      outcome: "REJECT",
      profile_id: "person-1",
      subject_id: "private text here",
      trigger: "CONTENT_REPORTED",
      from: "2026-09-12",
      to: "2026-09-12",
      preview: "private text",
    })
  );
  expect(filters).toEqual({
    subject_type: "DROP",
    outcome: "REJECT",
    profile_id: "person-1",
    trigger: "CONTENT_REPORTED",
    from: Date.UTC(2026, 8, 12),
    to: Date.UTC(2026, 8, 13) - 1,
  });
});
