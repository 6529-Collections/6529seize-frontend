interface IpfsServiceConfig {
  apiEndpoint: string;
  mfsPath?: string | undefined;
}

const getErrorMessage = (error: unknown): unknown =>
  error instanceof Error ? error.message : error;

// Kubo RPC accepts POST only and reports failures with non-2xx statuses.
async function postIpfsRpc(url: string, body?: FormData): Promise<Response> {
  const response = await fetch(url, { method: "POST", body: body ?? null });
  if (!response.ok) {
    throw new Error(`IPFS request failed with status ${response.status}`);
  }
  return response;
}

// `add` streams one JSON object per line; the last line describes the file.
async function readAddedCid(response: Response): Promise<string> {
  const lines = (await response.text()).trim().split("\n");
  const added = JSON.parse(lines.at(-1) ?? "") as { Hash?: unknown };
  if (typeof added.Hash !== "string" || !added.Hash) {
    throw new Error("IPFS add response did not include a CID");
  }
  return added.Hash;
}

class IpfsService {
  private readonly apiEndpoint: string;
  private readonly mfsEnabled: boolean;
  private readonly mfsPath?: string | undefined;

  constructor(config: IpfsServiceConfig) {
    this.apiEndpoint = config.apiEndpoint;
    this.mfsEnabled = !!config.mfsPath;
    this.mfsPath = config.mfsPath;
  }

  async init() {
    if (!this.mfsEnabled) return;

    try {
      await postIpfsRpc(
        `${this.apiEndpoint}/api/v0/files/mkdir?arg=/${this.mfsPath}&parents=true`
      );
    } catch (error) {
      console.error("Failed to configure MFS:", getErrorMessage(error));
      throw error;
    }
  }

  private async validateFileName(cid: string, file: File) {
    if (!this.mfsEnabled) return;

    const extension = file.name.split(".").pop();
    const fileName = `${cid}.${extension}`;

    try {
      await postIpfsRpc(
        `${this.apiEndpoint}/api/v0/files/stat?arg=/${this.mfsPath}/${fileName}`
      );
    } catch {
      await postIpfsRpc(
        `${this.apiEndpoint}/api/v0/files/cp?arg=/ipfs/${cid}&arg=/${this.mfsPath}/${fileName}`
      );
    }
  }

  async addFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const addResponse = await postIpfsRpc(
        `${this.apiEndpoint}/api/v0/add?pin=true`,
        formData
      );

      const cid = await readAddedCid(addResponse);

      await this.validateFileName(cid, file);

      return cid;
    } catch (error) {
      console.error(
        "Failed to add file to IPFS or MFS:",
        getErrorMessage(error)
      );
      throw error;
    }
  }
}

export default IpfsService;
