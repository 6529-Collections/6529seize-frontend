export class MetadataNotFoundError extends Error {
  constructor() {
    super("OG metadata not found.");
    this.name = "MetadataNotFoundError";
  }
}
