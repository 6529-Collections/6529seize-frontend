import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropCompact from "@/components/drops/create/compact/CreateDropCompact";
import { CreateDropType } from "@/components/drops/create/types";

jest.mock("@/components/drops/create/utils/CreateDropContent", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="content">{children}</div>,
}));

jest.mock("@/components/utils/button/PrimaryButton", () => (props: any) => (
  <button
    disabled={props.disabled}
    onClick={() => {
      if (!props.disabled) {
        props.onClicked();
      }
    }}
  >
    {props.children}
  </button>
));

describe("CreateDropCompact", () => {
  it("renders submit button text based on type", async () => {
    const user = userEvent.setup();
    const onDrop = jest.fn();
    render(
      <CreateDropCompact
        waveId="1"
        profile={{} as any}
        screenType={"MOBILE" as any}
        editorState={null}
        title={null}
        files={[]}
        metadata={[]}
        canSubmit={true}
        canAddPart={true}
        loading={false}
        type={CreateDropType.DROP}
        drop={null}
        showSubmit
        missingMedia={[] as any}
        missingMetadata={[] as any}
        onViewChange={jest.fn()}
        onMetadataRemove={jest.fn()}
        onEditorState={jest.fn()}
        onUploadEditorStateChange={jest.fn()}
        onMentionedUser={jest.fn()}
        onMentionedWave={jest.fn()}
        onReferencedNft={jest.fn()}
        onFileRemove={jest.fn()}
        setFiles={jest.fn()}
        onDrop={onDrop}
        onDropPart={jest.fn()}
      >
        <div />
      </CreateDropCompact>
    );
    await user.click(screen.getByText("Drop"));
    expect(onDrop).toHaveBeenCalled();
  });

  it("does not submit or remove files while loading", async () => {
    const user = userEvent.setup();
    const onDrop = jest.fn();
    const onFileRemove = jest.fn();
    const file = new File(["a"], "a.png", { type: "image/png" });

    render(
      <CreateDropCompact
        waveId="1"
        profile={{} as any}
        screenType={"MOBILE" as any}
        editorState={null}
        title={null}
        files={[file]}
        metadata={[]}
        canSubmit={true}
        canAddPart={true}
        loading={true}
        type={CreateDropType.DROP}
        drop={null}
        showSubmit
        missingMedia={[] as any}
        missingMetadata={[] as any}
        onViewChange={jest.fn()}
        onMetadataRemove={jest.fn()}
        onEditorState={jest.fn()}
        onUploadEditorStateChange={jest.fn()}
        onMentionedUser={jest.fn()}
        onMentionedWave={jest.fn()}
        onReferencedNft={jest.fn()}
        onFileRemove={onFileRemove}
        setFiles={jest.fn()}
        onDrop={onDrop}
        onDropPart={jest.fn()}
      >
        <div />
      </CreateDropCompact>
    );

    await user.click(screen.getByText("Drop"));
    await user.click(screen.getByRole("button", { name: /remove file/i }));

    expect(onDrop).not.toHaveBeenCalled();
    expect(onFileRemove).not.toHaveBeenCalled();
  });
});
