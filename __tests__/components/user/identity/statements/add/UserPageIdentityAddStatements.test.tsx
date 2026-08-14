import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityAddStatements, {
  STATEMENT_ADD_VIEW,
} from "@/components/user/identity/statements/add/UserPageIdentityAddStatements";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

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
  render(<UserPageIdentityAddStatements profile={profile} onClose={onClose} />);

  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalled();

  onClose.mockClear();
  const backdrop = document.querySelector(".tw-fixed.tw-inset-0");
  if (!backdrop) {
    throw new Error("Expected the dialog backdrop to be rendered.");
  }
  await user.click(backdrop);
  expect(onClose).toHaveBeenCalled();
});

test("changes active view when child triggers", async () => {
  render(<UserPageIdentityAddStatements profile={profile} onClose={() => {}} />);
  const div = screen.getByTestId("views");
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.SELECT);
  await userEvent.click(div);
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.CONTACT);
});
