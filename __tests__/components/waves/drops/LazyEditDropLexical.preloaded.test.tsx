import LazyEditDropLexical from "@/components/waves/drops/LazyEditDropLexical";
import { editDropLexicalLoader } from "@/components/waves/drops/editDropLexicalLoader";
import { act, render, screen } from "@testing-library/react";

// Its own file, so the editor chunk is fetched by a preload and by nothing
// else before the first edit: the warm-up path (idle).
jest.mock("@/components/waves/drops/EditDropLexical", () => ({
  __esModule: true,
  default: () => <div role="textbox" aria-label="Edit drop" />,
}));

describe("LazyEditDropLexical after its chunk was preloaded", () => {
  it("renders the editor in the first pass, with no placeholder frame", async () => {
    editDropLexicalLoader.preload();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Nothing below awaits. A next/dynamic loader still suspended on the first
    // render even though the module was cached, and React throttled the reveal
    // by about 300 ms.
    render(
      <LazyEditDropLexical
        initialContent="hello"
        initialMentions={[]}
        initialGroupMentions={[]}
        initialWaveMentions={[]}
        canMentionAll={false}
        waveId="wave-1"
        isSaving={false}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole("textbox", { name: "Edit drop" })).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
