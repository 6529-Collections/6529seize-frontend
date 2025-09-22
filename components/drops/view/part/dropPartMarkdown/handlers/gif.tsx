import { renderGifEmbed } from "../renderers";
import { createSimpleHandler } from "./simpleHandler";

const gifRegex = /^https?:\/\/media\.tenor\.com\/[^\s]+\.gif$/i;

export const createGifHandler = () =>
  createSimpleHandler({
    match: (href) => gifRegex.test(href),
    render: (href) => renderGifEmbed(href),
  });
