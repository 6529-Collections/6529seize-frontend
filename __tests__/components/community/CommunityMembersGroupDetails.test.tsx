import CommunityMembersGroupDetails from "@/components/community/CommunityMembersGroupDetails";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/groups/page/list/card/GroupCardConfigs",
  () =>
    ({ group }: any) => <div data-testid="group-criteria">{group.id}</div>
);

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const useQueryMock = useQuery as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;

describe("CommunityMembersGroupDetails", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows a stable loading state", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(
      <CommunityMembersGroupDetails groupId="group-1" onClose={jest.fn()} />
    );

    expect(screen.getByText("Loading group criteria")).toBeInTheDocument();
  });

  it("encodes the group id before adding it to the API path", async () => {
    commonApiFetchMock.mockResolvedValue({});
    useQueryMock.mockImplementation(({ queryFn }) => {
      void queryFn();
      return {
        data: undefined,
        isLoading: true,
        isError: false,
      };
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group/with?segments"
        onClose={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(commonApiFetchMock).toHaveBeenCalledWith({
        endpoint: "groups/group%2Fwith%3Fsegments",
      })
    );
  });

  it("shows a privacy-safe unavailable state", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(
      <CommunityMembersGroupDetails groupId="private-id" onClose={jest.fn()} />
    );

    expect(screen.getByText("Group criteria unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This group may be private, deleted, or temporarily unavailable."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("private-id")).not.toBeInTheDocument();
  });

  it("shows group criteria without edit controls", () => {
    useQueryMock.mockReturnValue({
      data: { id: "group-1", name: "Artists and curators" },
      isLoading: false,
      isError: false,
    });

    const onClose = jest.fn();
    render(
      <CommunityMembersGroupDetails groupId="group-1" onClose={onClose} />
    );

    expect(screen.getByText("Selected group")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Artists and curators" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("group-criteria")).toHaveTextContent("group-1");
    expect(screen.queryByText("Group options")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Clear selected group" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
