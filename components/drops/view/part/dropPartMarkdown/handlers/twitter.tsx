import { renderTweetEmbed } from "../renderers";
import { isTwitterLink } from "../twitter";
import { createSimpleHandler } from "./simpleHandler";

export const createTwitterHandler = () =>
  createSimpleHandler({
    match: isTwitterLink,
    render: (href) => renderTweetEmbed(href),
  });
