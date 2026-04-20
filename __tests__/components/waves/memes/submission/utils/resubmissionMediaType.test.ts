import { getResubmissionMediaTypeInfo } from "@/components/waves/memes/submission/utils/resubmissionMediaType";

describe("getResubmissionMediaTypeInfo", () => {
  it("requires interactive metadata for supported GLTF MIME types", () => {
    expect(
      getResubmissionMediaTypeInfo({ mimeType: "model/gltf+json" })
    ).toEqual({
      label: "GLTF",
      isInteractive: true,
    });
    expect(
      getResubmissionMediaTypeInfo({ mimeType: "model/gltf-binary" })
    ).toEqual({
      label: "GLB",
      isInteractive: true,
    });
  });

  it("recognizes GLTF media from file and URL fallbacks", () => {
    expect(getResubmissionMediaTypeInfo({ fileName: "model.gltf" })).toEqual({
      label: "GLTF",
      isInteractive: true,
    });
    expect(
      getResubmissionMediaTypeInfo({ url: "https://example.com/model.glb" })
    ).toEqual({
      label: "GLB",
      isInteractive: true,
    });
  });
});
