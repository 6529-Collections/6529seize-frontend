import GroupsPage from "@/app/[user]/groups/page";
import { notFound, redirect } from "next/navigation";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: jest.fn(),
}));

describe("profile Groups redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns not found for the removed Network Groups route", async () => {
    await expect(
      GroupsPage({ params: Promise.resolve({ user: "network" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("preserves the profile Groups redirect", async () => {
    await GroupsPage({ params: Promise.resolve({ user: "alice" }) });

    expect(notFound).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/alice");
  });
});
