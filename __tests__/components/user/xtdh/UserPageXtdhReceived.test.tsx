import { render, screen } from "@testing-library/react";
import XtdhReceivedSection from "@/components/xtdh/received";
import UserPageXtdhReceived from "@/components/xtdh/user/received";

jest.mock("@/components/xtdh/received", () => ({
  __esModule: true,
  default: jest.fn(({ profileId }: { readonly profileId: string | null }) => (
    <section data-testid="received-section">{profileId}</section>
  )),
}));

const mockReceivedSection = XtdhReceivedSection as jest.MockedFunction<
  typeof XtdhReceivedSection
>;

describe("UserPageXtdhReceived", () => {
  beforeEach(() => {
    mockReceivedSection.mockClear();
  });

  it("passes the profile id to the received xTDH section", () => {
    render(<UserPageXtdhReceived profileId="simo" />);

    expect(screen.getByTestId("received-section")).toHaveTextContent("simo");
    expect(mockReceivedSection.mock.calls[0]?.[0]).toEqual({
      profileId: "simo",
    });
  });
});
