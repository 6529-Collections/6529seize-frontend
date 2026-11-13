import MobileTabCards, {
  type MobileTab,
} from "@/components/user/rep/MobileTabCards";
import { act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

function ProfileSections() {
  const [activeTab, setActiveTab] = useState<MobileTab>("rep");
  return <MobileTabCards activeTab={activeTab} onTabChange={setActiveTab} />;
}

it("enables mobile profile sections after hydration and selects ID Statements on the first click", async () => {
  const user = userEvent.setup();
  const container = document.createElement("div");
  container.innerHTML = renderToString(<ProfileSections />);
  document.body.appendChild(container);

  const onRecoverableError = jest.fn();
  let root: Root | undefined;

  try {
    const sections = within(container);
    const rep = sections.getByRole("button", { name: "REP" });
    const nic = sections.getByRole("button", { name: "NIC" });
    const statements = sections.getByRole("button", { name: "ID Statements" });
    for (const button of [rep, nic, statements]) {
      expect(button).toBeDisabled();
    }
    expect(rep).toHaveAttribute("aria-pressed", "true");
    expect(statements).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      root = hydrateRoot(container, <ProfileSections />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    for (const button of [rep, nic, statements]) {
      expect(button).toBeEnabled();
    }
    await user.click(statements);
    expect(statements).toHaveAttribute("aria-pressed", "true");
    expect(rep).toHaveAttribute("aria-pressed", "false");
  } finally {
    act(() => root?.unmount());
    container.remove();
  }
});
