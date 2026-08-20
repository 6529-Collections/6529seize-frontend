import { render, screen } from "@testing-library/react";
import UserPageIdentityAddStatementsPlatformPicker from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsPlatformPicker";
import { STATEMENT_TYPE } from "@/helpers/Types";

let isTouchDevice = false;
let tooltipProps: Record<string, unknown> | null = null;

jest.mock("@/hooks/useIsTouchDevice", () => () => isTouchDevice);
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/i18n/messages", () => ({ t: () => "Choose a platform" }));
jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton",
  () => ({
    __esModule: true,
    ADD_STATEMENT_PLATFORM_TOOLTIP_ID: "platform-tooltip",
    default: ({ statementType }: { statementType: STATEMENT_TYPE }) => (
      <button type="button">{statementType}</button>
    ),
  })
);
jest.mock("react-tooltip", () => ({
  Tooltip: (props: Record<string, unknown>) => {
    tooltipProps = props;
    return <div data-testid="tooltip" />;
  },
}));

const renderPicker = () =>
  render(
    <UserPageIdentityAddStatementsPlatformPicker
      statementTypes={[STATEMENT_TYPE.X, STATEMENT_TYPE.FACEBOOK]}
      activeType={STATEMENT_TYPE.X}
      rowCount={1}
      onSelect={jest.fn()}
    />
  );

describe("UserPageIdentityAddStatementsPlatformPicker", () => {
  beforeEach(() => {
    isTouchDevice = false;
    tooltipProps = null;
  });

  it("keeps hover and focus tooltip behavior for pointer devices", () => {
    renderPicker();

    expect(
      screen.getByRole("group", { name: "Choose a platform" })
    ).toHaveProperty("tagName", "FIELDSET");
    expect(tooltipProps).toMatchObject({
      delayShow: 250,
      clickable: false,
    });
    expect(tooltipProps).not.toHaveProperty("openEvents");
    expect(tooltipProps).not.toHaveProperty("closeEvents");
    expect(tooltipProps).not.toHaveProperty("globalCloseEvents");
  });

  it("reveals platform names on tap for touch devices", () => {
    isTouchDevice = true;
    renderPicker();

    expect(tooltipProps).toMatchObject({
      delayShow: 0,
      clickable: true,
      openEvents: { click: true },
      closeEvents: { click: true },
      globalCloseEvents: { clickOutsideAnchor: true },
    });
  });
});
