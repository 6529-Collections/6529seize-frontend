import { toProfileIdentitySegment } from "@/helpers/profile-identity-segment";

describe("toProfileIdentitySegment", () => {
  it.each([
    ["punk6529", "punk6529"],
    ["Punk6529", "punk6529"],
    ["BRÜDER", "br%C3%BCder"],
    ["br%C3%9Cder", "br%C3%BCder"],
    ["Br%C3%9Cder", "br%C3%BCder"],
    ["a/b", "a%2Fb"],
    ["%E0%A4%A", "%25e0%25a4%25a"],
  ])("maps %s to the single segment %s", (identity, segment) => {
    expect(toProfileIdentitySegment(identity)).toBe(segment);
  });

  it.each(["", ".", "..", "%2E%2E"])(
    "rejects %j, which cannot be one path segment",
    (identity) => {
      expect(toProfileIdentitySegment(identity)).toBeNull();
    }
  );
});
