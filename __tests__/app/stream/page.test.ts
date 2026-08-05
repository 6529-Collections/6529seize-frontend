const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const mockRedirect = jest.fn(() => {
  throw new Error("NEXT_REDIRECT");
});

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
  it("redirects production traffic to the published Stream review", () => {
    expect(() => StreamReviewRedirectPage()).toThrow("NEXT_REDIRECT");
    expect(mockNotFound).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/reviews/6529-stream");
  });
});
