import * as mod from "@/components/drops/create/lexical/nodes/HashtagNode";

describe("HashtagNode exports", () => {
  it("exposes helpers", () => {
    expect(typeof mod.$createHashtagNode).toBe("function");
    expect(typeof mod.$isHashtagNode).toBe("function");
  });
});
