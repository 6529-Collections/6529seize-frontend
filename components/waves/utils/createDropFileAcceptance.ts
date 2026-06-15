export const isCsvFile = (file: File): boolean =>
  file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");

export const getAcceptedCreateDropFiles = ({
  files,
  isDropMode,
}: {
  readonly files: File[];
  readonly isDropMode: boolean;
}): {
  readonly acceptedFiles: File[];
  readonly rejectedCsvFiles: File[];
} => {
  if (!isDropMode) {
    return {
      acceptedFiles: files,
      rejectedCsvFiles: [],
    };
  }

  const rejectedCsvFiles = files.filter(isCsvFile);

  return {
    acceptedFiles: files.filter((file) => !isCsvFile(file)),
    rejectedCsvFiles,
  };
};
