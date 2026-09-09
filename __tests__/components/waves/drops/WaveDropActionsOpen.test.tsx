import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties, ReactNode } from "react";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("react-tooltip", () => ({
  Tooltip: ({
    style,
    children,
  }: {
    readonly style?: CSSProperties;
    readonly children?: ReactNode;
  }) => (
    <div role="tooltip" data-z-index={String(style?.zIndex)}>
      {children}
    </div>
  ),
}));

afterEach(() => jest.clearAllMocks());

test("returns null for chat drops", () => {
  const drop = { id: "1", drop_type: ApiDropType.Chat } as any;
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  (usePathname as jest.Mock).mockReturnValue("/");
  (useSearchParams as jest.Mock).mockReturnValue({
    get: jest.fn(),
  });
  const { container } = render(<WaveDropActionsOpen drop={drop} />);
  expect(container.firstChild).toBeNull();
});

test("pushes route on click", async () => {
  const user = userEvent.setup();
  const push = jest.fn();
  const drop = { id: "2", drop_type: ApiDropType.Winner } as any;
  (useRouter as jest.Mock).mockReturnValue({
    push,
  });
  (usePathname as jest.Mock).mockReturnValue("/wave");
  (useSearchParams as jest.Mock).mockReturnValue({
    get: jest.fn(),
  });
  render(<WaveDropActionsOpen drop={drop} />);
  const button = screen.getByRole("button", { name: "Open drop" });
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  await user.hover(button);
  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip).toHaveAttribute(
    "data-z-index",
    String(TOOLTIP_STYLES.zIndex)
  );
  expect(tooltip.parentElement).toBe(document.body);
  await user.click(button);
  expect(push).toHaveBeenCalled();
});

test("does not bubble the open action to a parent card", async () => {
  const user = userEvent.setup();
  const push = jest.fn();
  const onParentClick = jest.fn();
  const drop = { id: "3", drop_type: ApiDropType.Winner } as any;
  (useRouter as jest.Mock).mockReturnValue({ push });
  (usePathname as jest.Mock).mockReturnValue("/wave");
  (useSearchParams as jest.Mock).mockReturnValue({
    toString: () => "",
  });

  render(
    <div onClick={onParentClick}>
      <WaveDropActionsOpen drop={drop} />
    </div>
  );

  await user.click(screen.getByRole("button"));

  expect(push).toHaveBeenCalled();
  expect(onParentClick).not.toHaveBeenCalled();
});
