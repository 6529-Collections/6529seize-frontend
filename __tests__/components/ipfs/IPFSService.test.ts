import IpfsService from "@/components/ipfs/IPFSService";

const fetchMock = jest.fn();

function rpcResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () =>
      typeof body === "string" ? body : JSON.stringify(body ?? {}),
  } as Response;
}

describe("IpfsService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("adds file to ipfs and returns cid", async () => {
    const service = new IpfsService({ apiEndpoint: "https://test.6529.io" });
    const file = new File(["a"], "a.txt", { type: "text/plain" });
    fetchMock.mockResolvedValueOnce(rpcResponse({ Hash: "cid123" }));
    const cid = await service.addFile(file);
    expect(cid).toBe("cid123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://test.6529.io/api/v0/add?pin=true");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("reads the CID from the last line of a streamed add response", async () => {
    const service = new IpfsService({ apiEndpoint: "https://test.6529.io" });
    fetchMock.mockResolvedValueOnce(
      rpcResponse('{"Name":"a.txt","Bytes":1}\n{"Name":"a.txt","Hash":"cid789"}\n')
    );
    await expect(
      service.addFile(new File(["a"], "a.txt", { type: "text/plain" }))
    ).resolves.toBe("cid789");
  });

  it("creates mfs directory on init", async () => {
    const service = new IpfsService({
      apiEndpoint: "https://test.6529.io",
      mfsPath: "files",
    });
    fetchMock.mockResolvedValueOnce(rpcResponse({}));
    await service.init();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://test.6529.io/api/v0/files/mkdir?arg=/files&parents=true",
      { method: "POST", body: null }
    );
  });

  it("does nothing on init without an mfs path", async () => {
    const service = new IpfsService({ apiEndpoint: "https://test.6529.io" });
    await service.init();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects init when the mfs directory cannot be created", async () => {
    const service = new IpfsService({
      apiEndpoint: "https://test.6529.io",
      mfsPath: "files",
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    fetchMock.mockResolvedValueOnce(rpcResponse("forbidden", 403));
    try {
      await expect(service.init()).rejects.toThrow(
        "IPFS request failed with status 403"
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("copies file to mfs when not existing", async () => {
    const service = new IpfsService({
      apiEndpoint: "https://test.6529.io",
      mfsPath: "files",
    });
    const file = new File(["data"], "img.png", { type: "image/png" });
    fetchMock
      .mockResolvedValueOnce(rpcResponse({ Hash: "cid456" })) // add
      .mockResolvedValueOnce(rpcResponse("file does not exist", 500)) // stat
      .mockResolvedValueOnce(rpcResponse({})); // cp
    const cid = await service.addFile(file);
    expect(cid).toBe("cid456");
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://test.6529.io/api/v0/add?pin=true",
      "https://test.6529.io/api/v0/files/stat?arg=/files/cid456.png",
      "https://test.6529.io/api/v0/files/cp?arg=/ipfs/cid456&arg=/files/cid456.png",
    ]);
  });

  it("skips the copy when the file already exists in mfs", async () => {
    const service = new IpfsService({
      apiEndpoint: "https://test.6529.io",
      mfsPath: "files",
    });
    fetchMock
      .mockResolvedValueOnce(rpcResponse({ Hash: "cid456" }))
      .mockResolvedValueOnce(rpcResponse({ Type: "file" }));
    await service.addFile(new File(["data"], "img.png", { type: "image/png" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects when the add request fails", async () => {
    const service = new IpfsService({ apiEndpoint: "https://test.6529.io" });
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    fetchMock.mockResolvedValueOnce(rpcResponse("bad gateway", 502));
    try {
      await expect(
        service.addFile(new File(["a"], "a.txt", { type: "text/plain" }))
      ).rejects.toThrow("IPFS request failed with status 502");
    } finally {
      consoleError.mockRestore();
    }
  });
});
