import type { ExtraProps } from "react-markdown";
import type { Plugin } from "unified";
import { parseUrl } from "@/components/drops/view/part/dropPartMarkdown/linkUtils";
import { IMAGE_RESIZE_CDN_ORIGIN } from "@/helpers/image-resize-cdn";

type Element = NonNullable<ExtraProps["node"]>;
type Content = Element["children"][number];
interface Root {
  type: "root";
  children: Content[];
}

export function isDropNotificationImage(src: unknown): src is string {
  if (typeof src !== "string") return false;
  const url = parseUrl(src);
  return (
    url?.origin === IMAGE_RESIZE_CDN_ORIGIN &&
    src === `${url.origin}${url.pathname}` &&
    /^\/drops\/[\w-]+\/[\w.-]+\.(?:png|jpe?g|webp|gif|avif)$/i.test(
      url.pathname
    )
  );
}

/** Move the first hosted upload beside the clamped text and omit the rest. */
export const rehypeDropNotificationPreview: Plugin<[], Root> = () => (tree) => {
  let image: Element | undefined;

  function separateImages(children: Content[]): Content[] {
    return children.map((child): Content => {
      if (child.type !== "element") return child;
      if (
        child.tagName === "img" &&
        isDropNotificationImage(child.properties["src"])
      ) {
        image ??= child;
        // Keep words on either side of an inline image from running together.
        return { type: "text", value: " " };
      }
      return { ...child, children: separateImages(child.children) };
    });
  }

  const children = separateImages(tree.children);
  const text: Element = {
    type: "element",
    tagName: "div",
    properties: {
      className: [
        "tw-min-w-0",
        "tw-line-clamp-2",
        "tw-max-h-10",
        "tw-overflow-hidden",
      ],
    },
    children,
  };
  tree.children = image ? [image, text] : [text];
};
