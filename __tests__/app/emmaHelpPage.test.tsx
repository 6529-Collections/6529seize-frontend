import { render, screen } from "@testing-library/react";
import EmmaHelpPage from "@/app/emma/help/page";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import messages from "@/i18n/messages/emma.en-US.json";
import type { MessageKey } from "@/i18n/messages";

jest.mock(
  "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper",
  () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  })
);

it("provides the full public introduction, Janus link and a way back without auth", () => {
  render(<EmmaHelpPage />);
  expect(
    screen.getByRole("heading", { level: 1, name: /Meet EMMA/ })
  ).toBeVisible();
  expect(screen.getByText(/EMMA was created/)).toBeVisible();
  expect(screen.getByText(/significant computational resources/)).toBeVisible();
  expect(screen.getByText(/Users with TDH </)).toBeVisible();
  expect(screen.getByRole("link", { name: "Janus" })).toHaveAttribute(
    "href",
    "https://github.com/6529-Collections/Janus"
  );
  expect(screen.getByRole("link", { name: "Back to EMMA" })).toHaveAttribute(
    "href",
    "/emma"
  );
});

it.each(SUPPORTED_LOCALES)(
  "provides complete English fallback for %s",
  (locale) => {
    for (const key of Object.keys(messages) as MessageKey[]) {
      expect(t(locale, key)).toBe(t("en-US", key));
    }
  }
);
