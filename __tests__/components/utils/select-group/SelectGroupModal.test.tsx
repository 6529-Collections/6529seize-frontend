import React from "react";
import { render, cleanup, act, waitFor } from "@testing-library/react";
import SelectGroupModal from "@/components/utils/select-group/SelectGroupModal";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const useQueryMock = jest.fn(() => ({ data: [{ id: 1, group_name: "g" }], isFetching: false }));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (opts: any) => useQueryMock(opts),
  keepPreviousData: {},
}));

jest.mock("react-use", () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
  useCss: jest.fn(() => ["", jest.fn()]),
}));

const searchProps: any = {};

jest.mock("@/components/utils/select-group/SelectGroupModalHeader", () => (props: any) => (
  <div data-testid="header" onClick={props.onClose}></div>
));

jest.mock("@/components/utils/select-group/SelectGroupModalSearch", () => (props: any) => {
  Object.assign(searchProps, props);
  return <div data-testid="search" />;
});

const itemsMock = jest.fn();

jest.mock("@/components/utils/select-group/SelectGroupModalItems", () => (props: any) => {
  itemsMock(props);
  return <div data-testid="items" />;
});

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: any) => node,
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue([{ id: 1, group_name: "g" }]),
}));

describe("SelectGroupModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQueryMock.mockReturnValue({ data: [{ id: 1, group_name: "g" }], isFetching: false });
    itemsMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("passes groups to items and updates filters", async () => {
    const onClose = jest.fn();
    const onGroupSelect = jest.fn();
    render(<SelectGroupModal onClose={onClose} onGroupSelect={onGroupSelect} />);
    expect(itemsMock).toHaveBeenCalledWith(expect.objectContaining({ groups: [{ id: 1, group_name: "g" }], loading: false }));
    
    act(() => {
      searchProps.onUserSelect("bob");
    });
    
    await waitFor(() => {
      expect(useQueryMock).toHaveBeenLastCalledWith(expect.objectContaining({ queryKey: [QueryKey.GROUPS, { group_name: null, author_identity: "bob" }] }));
    });
  });
});
