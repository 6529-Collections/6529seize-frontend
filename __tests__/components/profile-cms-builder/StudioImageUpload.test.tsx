import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import StudioImageUpload from "@/components/profile-cms-builder/studio/StudioImageUpload";
import {
  cmsPackageSchema,
  withComputedCmsHashes,
  type CmsAssetV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import {
  CmsStudioImageUploadError,
  uploadCmsStudioImage,
} from "@/lib/profile-cms/studio/image-upload";
import roomFixture from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/exhibition-room.package.json";

jest.mock("@/lib/profile-cms/studio/image-upload", () => ({
  uploadCmsStudioImage: jest.fn(),
  CmsStudioImageUploadError: class extends Error {
    constructor(
      readonly code: string,
      readonly reference?: unknown
    ) {
      super(code);
    }
  },
}));

const asset: CmsAssetV1 = {
  id: "asset-new-image",
  kind: "image",
  uri: "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_test/id/image.png",
  content_hash: `sha256:${"a".repeat(64)}`,
  mime_type: "image/png",
  width: 640,
  height: 480,
  alt_text: "A landscape",
};
function fixture() {
  return withComputedCmsHashes(cmsPackageSchema.parse(roomFixture));
}
function chooseImage() {
  fireEvent.change(screen.getByLabelText("Image file"), {
    target: {
      files: [new File(["image"], "photo.png", { type: "image/png" })],
    },
  });
  fireEvent.change(screen.getByLabelText("Alt text"), {
    target: { value: "A landscape" },
  });
}
function begin() {
  chooseImage();
  fireEvent.click(screen.getByRole("button", { name: "Upload and add image" }));
}
function deferred() {
  let resolve!: (asset: CmsAssetV1) => void;
  const promise = new Promise<CmsAssetV1>((done) => {
    resolve = done;
  });
  jest.mocked(uploadCmsStudioImage).mockReturnValue(promise);
  return resolve;
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: () => "test-upload-id",
  });
  jest.mocked(uploadCmsStudioImage).mockResolvedValue(asset);
});

it("gates file upload on owner authentication and exposes the reason", () => {
  render(
    <StudioImageUpload
      document={fixture()}
      locale="en-US"
      canUpload={false}
      scopeKey="signed-out"
      onChange={jest.fn()}
    />
  );
  expect(screen.getByLabelText("Image file")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Upload and add image" })
  ).toBeDisabled();
  expect(
    screen.getByText("Sign in as the profile owner to upload images.")
  ).toBeVisible();
  expect(uploadCmsStudioImage).not.toHaveBeenCalled();
});

it("adds an image to the latest document without discarding edits made during upload", async () => {
  const resolve = deferred();
  const onChange = jest.fn<void, [CmsPackageV1]>();
  const document = fixture();
  const view = render(
    <StudioImageUpload
      document={document}
      locale="en-US"
      canUpload
      scopeKey="owner:profile:draft"
      onChange={onChange}
    />
  );
  begin();
  const edited = withComputedCmsHashes({
    ...document,
    site: { ...document.site, title: "Edited while uploading" },
  });
  view.rerender(
    <StudioImageUpload
      document={edited}
      locale="en-US"
      canUpload
      scopeKey="owner:profile:draft"
      onChange={onChange}
    />
  );
  await act(async () => {
    resolve(asset);
  });
  const result = onChange.mock.calls[0]![0];
  expect(result.site.title).toBe("Edited while uploading");
  expect(result.payload.assets).toEqual([...document.payload.assets, asset]);
  expect(result.payload.pages).toEqual(document.payload.pages);
  expect(result.integrity.package_hash).not.toBe(edited.integrity.package_hash);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Image added to your library"
  );
});

it.each(["scope", "authentication"])(
  "cancels and ignores completion after %s changes",
  async (change) => {
    const resolve = deferred();
    const onChange = jest.fn();
    const document = fixture();
    const view = render(
      <StudioImageUpload
        document={document}
        locale="en-US"
        canUpload
        scopeKey="owner-A"
        onChange={onChange}
      />
    );
    begin();
    const signal = jest.mocked(uploadCmsStudioImage).mock.calls[0]![0].signal;
    view.rerender(
      <StudioImageUpload
        document={document}
        locale="en-US"
        canUpload={change === "scope"}
        scopeKey={change === "scope" ? "owner-B" : "owner-A"}
        onChange={onChange}
      />
    );
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve(asset);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Alt text")).toHaveValue("");
  }
);

it("does not select a different block when selection changed during upload", async () => {
  const resolve = deferred();
  const initialSelection = jest.fn();
  const nextSelection = jest.fn();
  const onChange = jest.fn();
  const document = fixture();
  const view = render(
    <StudioImageUpload
      document={document}
      locale="en-US"
      canUpload
      scopeKey="owner"
      onChange={onChange}
      onAssetAdded={initialSelection}
    />
  );
  begin();
  view.rerender(
    <StudioImageUpload
      document={document}
      locale="en-US"
      canUpload
      scopeKey="owner"
      onChange={onChange}
      onAssetAdded={nextSelection}
    />
  );
  await act(async () => {
    resolve(asset);
  });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(initialSelection).not.toHaveBeenCalled();
  expect(nextSelection).not.toHaveBeenCalled();
});

it("retains and passes the completion reference for verification retry", async () => {
  const reference = { assetId: asset.id, completion: { media_url: asset.uri } };
  jest
    .mocked(uploadCmsStudioImage)
    .mockRejectedValueOnce(
      new CmsStudioImageUploadError("verification_failed", reference)
    );
  const onChange = jest.fn();
  render(
    <StudioImageUpload
      document={fixture()}
      locale="en-US"
      canUpload
      scopeKey="owner"
      onChange={onChange}
    />
  );
  begin();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Retry verification" })
    ).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry verification" }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  expect(jest.mocked(uploadCmsStudioImage).mock.calls[1]![0]).toMatchObject({
    assetId: asset.id,
    resume: reference,
  });
});

it("cancels on unmount and ignores late successful results", async () => {
  const resolve = deferred();
  const onChange = jest.fn();
  const view = render(
    <StudioImageUpload
      document={fixture()}
      locale="en-US"
      canUpload
      scopeKey="owner"
      onChange={onChange}
    />
  );
  begin();
  const signal = jest.mocked(uploadCmsStudioImage).mock.calls[0]![0].signal;
  view.unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => {
    resolve(asset);
  });
  expect(onChange).not.toHaveBeenCalled();
});
