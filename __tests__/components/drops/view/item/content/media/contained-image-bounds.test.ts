import { getContainedImageBounds } from "@/components/drops/view/item/content/media/containedImageBounds";

describe("getContainedImageBounds", () => {
  it("anchors left-top positioned contained images to the container origin", () => {
    expect(
      getContainedImageBounds({
        containerHeight: 400,
        containerWidth: 1000,
        naturalHeight: 400,
        naturalWidth: 500,
        objectPosition: "left top",
      })
    ).toEqual({
      height: 400,
      left: 0,
      top: 0,
      width: 500,
    });
  });

  it("centers contained images when object position is centered", () => {
    expect(
      getContainedImageBounds({
        containerHeight: 400,
        containerWidth: 1000,
        naturalHeight: 400,
        naturalWidth: 500,
        objectPosition: "center",
      })
    ).toEqual({
      height: 400,
      left: 250,
      top: 0,
      width: 500,
    });
  });
});
