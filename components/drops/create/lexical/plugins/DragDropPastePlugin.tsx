/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  INSERT_PARAGRAPH_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { commonApiPost } from "../../../../../services/api/common-api";
import { $createHashtagNode } from "../nodes/HashtagNode";
import { $createMentionNode } from "../nodes/MentionNode";
import { $createImageNode } from "../nodes/ImageNode";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

async function uploadImage(file: File): Promise<string> {
  const prep = await commonApiPost<
    {
      content_type: string;
      file_name: string;
      file_size: number;
    },
    {
      upload_url: string;
      content_type: string;
      media_url: string;
    }
  >({
    endpoint: "drop-media/prep",
    body: {
      content_type: file.type,
      file_name: file.name,
      file_size: file.size,
    },
  });
  const myHeaders = new Headers({
    "Content-Type": prep.content_type,
  });
  await fetch(prep.upload_url, {
    method: "PUT",
    headers: myHeaders,
    body: file,
  });
  return prep.media_url;
}

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
          );
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              const url =
                "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7c6c885e-87b2-11ee-9661-02424e2c14ad/db5b5b66-b56a-4492-8b5a-a82a02aa0d72.avif";

              editor.update(() => {
                const imageNode = $createImageNode({ src: "loading" });
                $insertNodes([imageNode]);
                const key = imageNode.getKey();
                uploadImage(file).then((url: string) => {
                  editor.update(() => {
                    const node = $getNodeByKey(key);
                    if (node) {
                      node.replace($createImageNode({ src: url }));
                    }
                  });
                });
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);
  return null;
}
