import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropEmojiPicker from "../../../components/waves/CreateDropEmojiPicker";

jest.mock("@emoji-mart/react", () => (props: any) => (
  <div data-testid="picker" onClick={() => props.onEmojiSelect({ native: "😀" })}></div>
));

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [{ update: (cb: any) => cb() }],
}));

const createTextNode = jest.fn(() => "node");
const insertNodes = jest.fn();

jest.mock("lexical", () => ({
  $createTextNode: (...args: any[]) => createTextNode(...args),
  $insertNodes: (...args: any[]) => insertNodes(...args),
}));

jest.mock("../../../hooks/useCapacitor", () => () => ({ isCapacitor: false }));
jest.mock("../../../hooks/isMobileScreen", () => () => false);
jest.mock("../../../contexts/EmojiContext", () => ({ useEmoji: () => ({ emojiMap: {}, categories: [], categoryIcons: {} }) }));

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: any) => node,
}));

describe("CreateDropEmojiPicker", () => {
  it("inserts emoji and closes picker", async () => {
    const user = userEvent.setup();
    render(<CreateDropEmojiPicker />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByTestId("picker")).toBeInTheDocument();
    await user.click(screen.getByTestId("picker"));
    expect(createTextNode).toHaveBeenCalledWith("😀");
    expect(insertNodes).toHaveBeenCalledWith(["node"]);
    expect(screen.queryByTestId("picker")).not.toBeInTheDocument();
  });
});
