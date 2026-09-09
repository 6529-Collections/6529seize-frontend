import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityAddStatements from "@/components/user/identity/statements/add/UserPageIdentityAddStatements";
import { STATEMENT_ADD_VIEW } from "@/components/user/identity/statements/add/UserPageIdentityAddStatements.constants";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { RefObject } from "react";

const mockKeyboardFocusScroll = jest.fn<
  void,
  [RefObject<HTMLElement | null>]
>();

jest.mock(
  "@/components/waves/create-wave/hooks/useKeyboardFocusScroll",
  () => ({
    __esModule: true,
    default: (ref: RefObject<HTMLElement | null>) =>
      mockKeyboardFocusScroll(ref),
  })
);

jest.mock(
  "@/components/user/identity/statements/add/UserPageIdentityAddStatementsViews",
  () => ({
    __esModule: true,
    default: ({
      activeView,
      setActiveView,
    }: {
      activeView: STATEMENT_ADD_VIEW;
      setActiveView: (view: STATEMENT_ADD_VIEW) => void;
    }) => (
      <div
        data-testid="views"
        onClick={() => setActiveView(STATEMENT_ADD_VIEW.CONTACT)}
      >
        {activeView}
      </div>
    ),
  })
);

const profile = { id: "1" } as ApiIdentity;

test("calls onClose on Escape and backdrop click", async () => {
  const onClose = jest.fn();
  const user = userEvent.setup();
  render(
    <UserPageIdentityAddStatements
      profile={profile}
      isOpen={true}
      onClose={onClose}
    />
  );

  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalled();

  onClose.mockClear();
  await user.click(screen.getByRole("dialog"));
  expect(onClose).toHaveBeenCalled();
});

test("changes active view when child triggers", async () => {
  render(
    <UserPageIdentityAddStatements
      profile={profile}
      isOpen={true}
      onClose={() => {}}
    />
  );
  const div = screen.getByTestId("views");
  const contentRef = mockKeyboardFocusScroll.mock.calls.at(-1)?.[0];

  expect(contentRef?.current).toContainElement(div);
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.SELECT);
  expect(div.parentElement).toHaveClass("lg:tw-py-8");
  await userEvent.click(div);
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.CONTACT);
  expect(div.parentElement).toHaveClass("md:tw-pt-6", "lg:tw-pb-8");
  expect(div.parentElement).not.toHaveClass("lg:tw-py-8");

  const backButton = screen.getByRole("button", { name: "Back" });
  const detailHeader = backButton.parentElement?.parentElement?.parentElement;
  expect(detailHeader).toHaveClass("md:!tw-pb-0");

  await userEvent.click(backButton);
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.SELECT);
});
