import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropFollowAuthor from "../../components/waves/drops/WaveDropFollowAuthor";
import { AuthContext } from "../../components/auth/Auth";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import React from "react";

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  __esModule: true,
  useMutation: jest.fn(),
}));

jest.mock("../../components/distribution-plan-tool/common/CircleLoader", () => ({ __esModule: true,
  CircleLoaderSize: { SMALL: "SMALL" },
  default: () => <div data-testid="loader" />,
}));

const { useMutation } = jest.requireMock("@tanstack/react-query");

function setup(subscribed: boolean) {
  const mutateAsyncFollow = jest.fn().mockResolvedValue(undefined);
  const mutateAsyncUnfollow = jest.fn().mockResolvedValue(undefined);
  (useMutation as jest.Mock).mockReturnValueOnce({ mutateAsync: mutateAsyncFollow }).mockReturnValueOnce({ mutateAsync: mutateAsyncUnfollow });
  const requestAuth = jest.fn().mockResolvedValue({ success: true });
  const invalidateDrops = jest.fn();
  render(
    <AuthContext.Provider value={{ setToast: jest.fn(), requestAuth } as any}>
      <ReactQueryWrapperContext.Provider value={{ invalidateDrops } as any}>
        <WaveDropFollowAuthor drop={{ author: { id: "1", handle: "bob", subscribed_actions: subscribed ? [1] : [] } } as any} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  return { mutateAsyncFollow, mutateAsyncUnfollow, requestAuth, invalidateDrops };
}

describe("WaveDropFollowAuthor", () => {
  it("follows when not following", async () => {
    const user = userEvent.setup();
    const { mutateAsyncFollow, requestAuth } = setup(false);
    await user.click(screen.getByRole("button"));
    expect(requestAuth).toHaveBeenCalled();
    expect(mutateAsyncFollow).toHaveBeenCalled();
  });

  it("unfollows when currently following", async () => {
    const user = userEvent.setup();
    const { mutateAsyncUnfollow } = setup(true);
    await user.click(screen.getByRole("button"));
    expect(mutateAsyncUnfollow).toHaveBeenCalled();
  });
});
