import CheckEvidence, {
  collectEvidenceLinks,
} from "@/app/content-moderation/checks/CheckEvidence";
import { readCheckFilters } from "@/app/content-moderation/checks/checks.helpers";
import { render, screen } from "@testing-library/react";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("renders flagged content as inert text with no automatic image or embedded content", () => {
  const evidence = {
    text: "<script>alert(1)</script>",
    media: "https://example.org/file.png",
    bad: "javascript:alert(1)",
  };
  const { container } = render(<CheckEvidence evidence={evidence} />);
  expect(container.querySelector("script, img, video, iframe")).toBeNull();
  expect(container.textContent).toContain("<script>alert(1)</script>");
  const link = screen.getByRole("link", { hidden: true });
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(
    collectEvidenceLinks({
      a: "https://user:pass@example.org/",
      b: "data:text/html,hi",
      c: "https://example.org/file.png",
    })
  ).toEqual(["https://example.org/file.png"]);
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
