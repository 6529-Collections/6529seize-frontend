import axios from "axios";
import FormData from "form-data";

interface IpfsServiceConfig {
  apiEndpoint: string;
  mfsPath?: string | undefined;
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
      await axios.post(
        `${this.apiEndpoint}/api/v0/files/mkdir?arg=/${this.mfsPath}&parents=true`
      );
    } catch (error: any) {
      console.error("Failed to configure MFS:", error.message);
      throw error;
    }
  }

  private createFormData(file: File): FormData {
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  }

  private async validateFileName(cid: string, file: File) {
    if (!this.mfsEnabled) return;

    const extension = file.name.split(".").pop();
    const fileName = `${cid}.${extension}`;

    try {
      await axios.post(
        `${this.apiEndpoint}/api/v0/files/stat?arg=/${this.mfsPath}/${fileName}`
      );
    } catch {
      await axios.post(
        `${this.apiEndpoint}/api/v0/files/cp?arg=/ipfs/${cid}&arg=/${this.mfsPath}/${fileName}`
      );
    }
  }

  async addFile(file: File): Promise<string> {
    try {
      const formData = this.createFormData(file);

      const addResponse = await axios.post(
        `${this.apiEndpoint}/api/v0/add?pin=true`,
        formData
      );

      const cid = addResponse.data.Hash;

      await this.validateFileName(cid, file);

      return cid;
    } catch (error: any) {
      console.error("Failed to add file to IPFS or MFS:", error.message);
      throw error;
    }
  }
}

export default IpfsService;
