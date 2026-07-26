const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.io",
  },
}));

import StreamReviewRedirectPage from "@/app/stream/page";

describe("/stream production gate", () => {
  it("terminates with not found before attempting a redirect", () => {
    expect(() => StreamReviewRedirectPage()).toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
