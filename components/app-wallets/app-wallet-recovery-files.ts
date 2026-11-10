import { Directory, Filesystem } from "@capacitor/filesystem";

/**
 * Earlier app versions saved recovery exports as
 * `<name>-<address>-plaintext-recovery.txt` and
 * `<name>-<address>-encrypted-recovery.json` in the app's Documents folder and
 * kept them there. Exports now go through a temporary file that is removed
 * after sharing, so these names only identify files from those versions.
 */
const PLAINTEXT_SUFFIX = "-plaintext-recovery.txt";
const ENCRYPTED_SUFFIX = "-encrypted-recovery.json";

export interface SavedRecoveryFile {
  readonly name: string;
  readonly plaintext: boolean;
}

/**
 * Lists recovery files an earlier export saved for this wallet. Throws when
 * the platform cannot list the Documents folder.
 */
export async function findSavedRecoveryFiles(
  address: string
): Promise<SavedRecoveryFile[]> {
  const { files } = await Filesystem.readdir({
    directory: Directory.Documents,
    path: "",
  });
  const addressPart = `-${address.toLowerCase()}`;
  return files.flatMap((file): SavedRecoveryFile[] => {
    if (file.type !== "file" || !file.name) {
      return [];
    }
    const lower = file.name.toLowerCase();
    if (lower.endsWith(`${addressPart}${PLAINTEXT_SUFFIX}`)) {
      return [{ name: file.name, plaintext: true }];
    }
    if (lower.endsWith(`${addressPart}${ENCRYPTED_SUFFIX}`)) {
      return [{ name: file.name, plaintext: false }];
    }
    return [];
  });
}

/** Deletes the given files and returns the ones that could not be deleted. */
export async function removeSavedRecoveryFiles(
  files: readonly SavedRecoveryFile[]
): Promise<SavedRecoveryFile[]> {
  const results = await Promise.allSettled(
    files.map((file) =>
      Filesystem.deleteFile({ directory: Directory.Documents, path: file.name })
    )
  );
  return files.filter((_, index) => results[index]?.status === "rejected");
}
