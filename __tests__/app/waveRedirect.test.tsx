import WaveRedirect from "@/app/waves/[wave]/page";
import { redirect } from "next/navigation";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

describe("Wave redirect page", () => {
  it("calls next/navigation redirect with wave param", async () => {
    await WaveRedirect({ params: { wave: "test-wave-123" } } as any);
    expect(redirect).toHaveBeenCalledWith("/waves?wave=test-wave-123");
  });
});
