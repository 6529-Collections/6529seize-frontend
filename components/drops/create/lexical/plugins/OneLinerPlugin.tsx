import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTextNode, RootNode } from "lexical";
import { useEffect } from "react";

const newlinesRegex = /[\n\r]/g;

export default function OneLinerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(RootNode, (rootNode: RootNode) => {
      const textContent = rootNode.getTextContent();

      // test if content has new line character(s)
      if (newlinesRegex.test(textContent)) {
        // yes, remove all new line chars
        const newText = textContent.replace(newlinesRegex, " ");

        // replace current content
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(newText));
        rootNode.clear().append(paragraph);
        rootNode.selectEnd(); // move cursor to end of text
      }
    });
  }, [editor]);
  return <></>;
}
