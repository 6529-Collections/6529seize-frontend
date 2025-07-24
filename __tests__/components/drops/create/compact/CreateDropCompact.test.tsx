import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropCompact from "../../../../../components/drops/create/compact/CreateDropCompact";
import { CreateDropType } from "../../../../../components/drops/create/types";

jest.mock("../../../../../components/drops/create/utils/CreateDropContent", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="content">{children}</div>,
}));

jest.mock("../../../../../components/utils/button/PrimaryButton", () => (props: any) => (
  <button onClick={props.onClicked}>{props.children}</button>
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
        onMentionedUser={jest.fn()}
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
});
