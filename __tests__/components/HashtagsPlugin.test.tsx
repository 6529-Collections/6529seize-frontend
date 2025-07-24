import { render } from "@testing-library/react";
import HashtagsPlugin from "../../components/drops/create/lexical/plugins/hashtags/HashtagsPlugin";

jest.mock("@lexical/react/LexicalComposerContext", () => ({ useLexicalComposerContext: () => [{}] }));

jest.mock("@lexical/react/LexicalTypeaheadMenuPlugin", () => ({
  LexicalTypeaheadMenuPlugin: (props: any) => {
    props.onOpen();
    return <div data-testid="plugin" />;
  },
  useBasicTypeaheadTriggerMatch: () => () => null,
  MenuOption: class {},
}));

describe("HashtagsPlugin", () => {
  it("exposes isHashtagsOpen", () => {
    const ref = { current: null } as any;
    render(<HashtagsPlugin ref={ref} onSelect={jest.fn()} />);
    expect(ref.current.isHashtagsOpen()).toBe(true);
  });
});
