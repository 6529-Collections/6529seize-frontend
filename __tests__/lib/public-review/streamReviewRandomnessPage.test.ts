jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { getCurrentRandomnessEditorialMarkdown } from "@/lib/public-review/streamReviewRandomnessPage";

const EDITORIAL = `# Randomness

For generative art, randomness is part of the work's provenance. A collector
should be able to determine which provider produced the input, which request it
answered, which token and collection it belonged to, how callbacks were
handled, whether anyone requested new randomness, and why the final seed is
permanent.

Stream therefore treats randomness as a lifecycle. Requests, delays, failures,
provider changes, retries, and disputed outputs all receive durable state.

## Each provider has its own trust model

Old provider copy.

## Questions for reviewers

9. Does every supported provider give artists and collectors an equally clear
   provenance record even though its trust model differs?`;

const SOURCE = {
  commit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
  repository: "6529-Collections/6529Stream",
};

describe("getCurrentRandomnessEditorialMarkdown", () => {
  it("replaces the current editorial with the plain-language guide", () => {
    const markdown = getCurrentRandomnessEditorialMarkdown({
      editorialMarkdown: EDITORIAL,
      source: SOURCE,
    });

    expect(markdown).toContain("## Randomness in one minute");
    expect(markdown).toContain("### What is in the reviewed code");
    expect(markdown).toContain("### What the accepted design says");
    expect(markdown).toContain("### What is still open");
    expect(markdown).toContain("a retry must not become a redraw");
    expect(markdown).toContain(
      "The current stale state is immediate and terminal"
    );
    expect(markdown).toContain("Provider migration governs future requests");
    expect(markdown).toContain(SOURCE.commit);
    expect(markdown).toContain(SOURCE.repository);
    expect(markdown).not.toContain("Old provider copy.");
  });

  it("fails closed when the pinned introduction changes", () => {
    expect(() =>
      getCurrentRandomnessEditorialMarkdown({
        editorialMarkdown: EDITORIAL.replace(
          "For generative art, randomness is part of the work's provenance.",
          "Changed introduction."
        ),
        source: SOURCE,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: randomness introduction."
    );
  });

  it("fails closed when the pinned ending changes", () => {
    expect(() =>
      getCurrentRandomnessEditorialMarkdown({
        editorialMarkdown: EDITORIAL.replace(
          "provenance record even though its trust model differs?",
          "changed ending?"
        ),
        source: SOURCE,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: randomness ending."
    );
  });
});
