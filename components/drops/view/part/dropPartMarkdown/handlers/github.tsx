import GithubLinkPreview, {
  parseGithubLink,
} from "@/components/waves/github/GithubLinkPreview";
import type { LinkHandler } from "../linkTypes";

export const createGithubHandler = (): LinkHandler => ({
  match: (href: string) => parseGithubLink(href) !== null,
  render: (href: string) => <GithubLinkPreview href={href} />,
  display: "block",
});
