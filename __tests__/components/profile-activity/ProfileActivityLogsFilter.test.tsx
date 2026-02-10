import ProfileActivityLogsFilter from "@/components/profile-activity/filter/ProfileActivityLogsFilter";
import { PROFILE_ACTIVITY_TYPE_TO_TEXT } from "@/entities/IProfile";
import { ProfileActivityLogType } from "@/types/enums";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock(
  "@/components/profile-activity/filter/ProfileActivityLogsFilterList",
  () => (props: any) => <div data-testid="list">{props.options.length}</div>
);

jest.mock("react-use", () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
}));

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: "div" },
  useAnimate: () => [React.createRef(), jest.fn()],
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
  await user.click(screen.getByRole("button"));
  expect(screen.getByTestId("list")).toBeInTheDocument();
  await user.click(screen.getByRole("button"));
  expect(screen.queryByTestId("list")).not.toBeInTheDocument();
});
