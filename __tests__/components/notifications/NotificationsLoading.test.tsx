import { render, screen } from "@testing-library/react";
import Loading from "@/app/notifications/loading";
import NotificationsLoading from "@/components/notifications/NotificationsLoading";

it("keeps the same loader markup from route preparation to client loading", () => {
  const { container, rerender } = render(<Loading />);
  const routeMarkup = container.innerHTML;
  rerender(<NotificationsLoading />);
  expect(container.innerHTML).toEqual(routeMarkup);
  expect(
    screen.getByRole("status", { name: "Loading notifications" })
  ).toBeInTheDocument();
  expect(container.querySelector(".tw-animate-pulse")).toBeNull();
});
