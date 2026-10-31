import { isValidElement, type ReactElement } from "react";

const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

jest.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: jest.fn(),
  usePathname: () => "/stream",
}));

const env = { BASE_ENDPOINT: "https://6529.io" };
jest.mock("@/config/env", () => ({ publicEnv: env }));

import StreamLayout from "@/app/stream/layout";
import MePage from "@/app/stream/me/page";
import EditionsPage from "@/app/stream/editions/page";
import WorkRoute from "@/app/stream/works/[id]/page";
import AboutRoute from "@/app/stream/about/[page]/page";
import StreamShell from "@/components/stream/layout/StreamShell";

describe("the /stream section behind its flag", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
  });

  it("passes the root page through and 404s every sub-page in production", async () => {
    env.BASE_ENDPOINT = "https://6529.io";
    const child = <p>placeholder</p>;
    expect(StreamLayout({ children: child })).toBe(child);
    expect(() => MePage()).toThrow("NEXT_NOT_FOUND");
    expect(() => EditionsPage()).toThrow("NEXT_NOT_FOUND");
    await expect(
      WorkRoute({ params: Promise.resolve({ id: "1" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the section shell and pages on staging", async () => {
    env.BASE_ENDPOINT = "https://staging.6529.io";
    const layout = StreamLayout({ children: <p>page</p> }) as ReactElement;
    expect(isValidElement(layout)).toBe(true);
    expect(layout.type).toBe(StreamShell);
    expect(isValidElement(MePage())).toBe(true);
    expect(
      isValidElement(await WorkRoute({ params: Promise.resolve({ id: "12" }) }))
    ).toBe(true);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("404s malformed work keys and unknown explainers", async () => {
    env.BASE_ENDPOINT = "http://localhost:3001";
    await expect(
      WorkRoute({ params: Promise.resolve({ id: "..%2Fx" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      AboutRoute({ params: Promise.resolve({ page: "overview" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      AboutRoute({ params: Promise.resolve({ page: "unknown" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(
      isValidElement(
        await AboutRoute({ params: Promise.resolve({ page: "how-it-works" }) })
      )
    ).toBe(true);
  });
});
