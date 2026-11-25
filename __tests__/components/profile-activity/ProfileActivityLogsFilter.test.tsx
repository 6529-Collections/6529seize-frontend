import ProfileActivityLogsFilter from "@/components/profile-activity/filter/ProfileActivityLogsFilter";
import { PROFILE_ACTIVITY_TYPE_TO_TEXT } from "@/entities/IProfile";
import { ProfileActivityLogType } from "@/types/enums";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { createPortal } from "react-dom";

jest.mock(
  "@/components/profile-activity/filter/ProfileActivityLogsFilterList",
  () => (props: any) => <div data-testid="list">{props.options.length}</div>
);

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () =>
    ({
      isOpen,
      label,
      setOpen,
      children,
    }: {
      isOpen: boolean;
      label: string;
      setOpen: (open: boolean) => void;
      children: React.ReactNode;
    }) =>
      isOpen
        ? createPortal(
            <div role="dialog" aria-label={label}>
              <button onClick={() => setOpen(false)}>Close panel</button>
              <ul>{children}</ul>
            </div>,
            document.body
          )
        : null
);

afterEach(() => jest.mocked(useIsMobileLayoutViewport).mockReturnValue(false));

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: "div" },
  useAnimate: () => [React.createRef(), jest.fn()],
  useReducedMotion: () => false,
}));

test("title updates based on selection", () => {
  const { rerender } = render(
    <ProfileActivityLogsFilter
      user={"u"}
      selected={[]}
      options={[ProfileActivityLogType.DROP_CREATED]}
      setSelected={jest.fn()}
    />
  );
  expect(screen.getByText("Select")).toBeInTheDocument();
  rerender(
    <ProfileActivityLogsFilter
      user={"u"}
      selected={[ProfileActivityLogType.DROP_CREATED]}
      options={[ProfileActivityLogType.DROP_CREATED]}
      setSelected={jest.fn()}
    />
  );
  expect(
    screen.getByText(
      PROFILE_ACTIVITY_TYPE_TO_TEXT[ProfileActivityLogType.DROP_CREATED]
    )
  ).toBeInTheDocument();
  rerender(
    <ProfileActivityLogsFilter
      user={"u"}
      selected={[
        ProfileActivityLogType.DROP_CREATED,
        ProfileActivityLogType.HANDLE_EDIT,
      ]}
      options={[
        ProfileActivityLogType.DROP_CREATED,
        ProfileActivityLogType.HANDLE_EDIT,
      ]}
      setSelected={jest.fn()}
    />
  );
  expect(screen.getByText("2 Selected")).toBeInTheDocument();
});

test("opens and closes list", async () => {
  const user = userEvent.setup();
  render(
    <ProfileActivityLogsFilter
      user={"u"}
      selected={[]}
      options={[ProfileActivityLogType.DROP_CREATED]}
      setSelected={jest.fn()}
    />
  );
  expect(screen.queryByTestId("list")).not.toBeInTheDocument();
  const trigger = screen.getByRole("button");
  expect(trigger).not.toHaveAttribute("aria-haspopup");
  await user.click(trigger);
  expect(screen.getByTestId("list")).toBeInTheDocument();
  await user.click(trigger);
  expect(screen.queryByTestId("list")).not.toBeInTheDocument();
});

test("mobile sheet stays open for multiple selections and deselections", async () => {
  jest.mocked(useIsMobileLayoutViewport).mockReturnValue(true);
  const user = userEvent.setup();
  const options = [
    ProfileActivityLogType.RATING_EDIT,
    ProfileActivityLogType.HANDLE_EDIT,
    ProfileActivityLogType.CLASSIFICATION_EDIT,
    ProfileActivityLogType.SOCIALS_EDIT,
  ];
  function Filter() {
    const [selected, setSelected] = React.useState(options);
    return (
      <ProfileActivityLogsFilter
        user="u"
        selected={selected}
        options={options}
        setSelected={(type) =>
          setSelected((current) =>
            current.includes(type)
              ? current.filter((item) => item !== type)
              : [...current, type]
          )
        }
      />
    );
  }
  render(<Filter />);
  const trigger = screen.getByRole("button", {
    name: /Filter activity types:/,
  });
  expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await user.click(trigger);
  await screen.findByRole("dialog", { name: "Activity types" });
  for (const type of options) {
    const option = screen.getByRole("button", {
      name: PROFILE_ACTIVITY_TYPE_TO_TEXT[type],
      exact: true,
    });
    await user.click(option);
    expect(option).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("dialog", { name: "Activity types" })
    ).toBeVisible();
  }
  await user.click(screen.getByRole("button", { name: "Rating", exact: true }));
  expect(
    screen.getByRole("button", { name: "Rating", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("dialog", { name: "Activity types" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Close panel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(trigger);
  expect(
    screen.getByRole("button", { name: "Rating", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: "Handle", exact: true })
  ).toHaveAttribute("aria-pressed", "false");
});
