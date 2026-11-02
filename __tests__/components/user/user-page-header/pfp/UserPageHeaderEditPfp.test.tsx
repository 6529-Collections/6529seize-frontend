import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageHeaderEditPfp from "@/components/user/user-page-header/pfp/UserPageHeaderEditPfp";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-object-url");
global.URL.revokeObjectURL = jest.fn();

jest.mock("@/components/user/settings/UserSettingsImgSelectMeme", () => ({
  __esModule: true,
  default: ({ onMeme }: any) => (
    <button data-testid="meme" onClick={() => onMeme({ id: 1, image: "m" })} />
  ),
}));
jest.mock("@/components/user/settings/UserSettingsImgSelectFile", () => ({
  __esModule: true,
  default: (props: any) => (
    <button
      data-testid="file"
      onClick={() =>
        props.setFile(
          new File([new ArrayBuffer(3000000)], "big.png", { type: "image/png" })
        )
      }
    />
  ),
}));
const mutateAsync = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutateAsync }),
  useQuery: () => ({ data: [] }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  useIpfsService: () => ({ addFile: jest.fn() }),
}));

const authCtx = {
  setToast: jest.fn(),
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
} as any;
const queryCtx = { onProfileEdit: jest.fn() } as any;

const profile = {
  handle: "me",
  query: "me",
  classification: "CLASS",
  pfp: null,
} as any;

describe("UserPageHeaderEditPfp", () => {
  it("renders in the shared responsive profile picture dialog", () => {
    render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(
      screen.getByRole("dialog", { name: "Profile picture" })
    ).toBeInTheDocument();
  });

  it("shows error when file too big", async () => {
    render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByTestId("file"));
    await userEvent.click(screen.getByRole("button", { name: "Save PFP" }));
    expect(
      screen.getByText("File size must be less than 2MB")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "File size must be less than 2MB"
    );
  });

  it("submits selected meme", async () => {
    render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByTestId("meme"));
    await userEvent.click(screen.getByRole("button", { name: "Save PFP" }));
    expect(authCtx.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
  });
  it("calls onClose when cancel clicked", async () => {
    const onClose = jest.fn();
    render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={onClose} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("revokes the preview object URL when the file is replaced and on unmount", async () => {
    const createObjectURL = jest.mocked(global.URL.createObjectURL);
    const revokeObjectURL = jest.mocked(global.URL.revokeObjectURL);
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    createObjectURL
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");

    const { unmount } = render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByTestId("file"));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("file"));
    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:first");

    await userEvent.click(screen.getByTestId("meme"));
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:second");

    createObjectURL.mockReturnValueOnce("blob:third");
    await userEvent.click(screen.getByTestId("file"));
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:third");
  });
});
