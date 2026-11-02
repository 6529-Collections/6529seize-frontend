import fs from "node:fs";
import path from "node:path";
import {
  APP_ROOT,
  findStreamingBoundaries,
} from "./support/notFoundStreamingBoundaries";

const NOT_FOUND_ROUTES = [
  "the-memes/[id]",
  "the-memes/[id]/distribution",
  "meme-lab/[id]",
  "meme-lab/[id]/distribution",
  "meme-lab/collection/[collection]",
  "6529-gradient/[id]",
  "rememes/[contract]/[id]",
  "[user]/[...cmsPath]",
];

describe("not-found streaming boundaries", () => {
  it.each(NOT_FOUND_ROUTES)(
    "keeps /%s free of streaming boundaries above its page",
    (route) => {
      expect(fs.existsSync(path.join(APP_ROOT, route))).toBe(true);
      expect(findStreamingBoundaries(route)).toEqual([]);
    }
  );
});
