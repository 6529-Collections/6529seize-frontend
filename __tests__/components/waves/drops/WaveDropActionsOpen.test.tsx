import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import { ApiDropType } from "@/generated/models/ApiDropType";
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
  await user.click(screen.getByRole("button"));
  expect(push).toHaveBeenCalled();
});
