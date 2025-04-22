class ObjectId {
  private static readonly hexChars = "0123456789abcdef";

  private readonly timestamp: number;
  private readonly machineId: number;
  private readonly processId: number;
  private readonly counter: number;

  constructor() {
    this.timestamp = Math.floor(Date.now() / 1000);
    this.machineId = Math.floor(Math.random() * 16777216);
    this.processId = Math.floor(Math.random() * 65536);
    this.counter = Math.floor(Math.random() * 16777216);
  }

  toString(): string {
    const hexChars = ObjectId.hexChars;
    const hexTimestamp = this.timestamp.toString(16).padStart(8, "0");
    const hexMachineId = this.machineId.toString(16).padStart(6, "0");
    const hexProcessId = this.processId.toString(16).padStart(4, "0");
    const hexCounter = this.counter.toString(16).padStart(6, "0");
    return hexTimestamp + hexMachineId + hexProcessId + hexCounter;
  }
}

export const truncateTextMiddle = (
  fullStr: string,
  strLen: number,
  separator: string = "..."
): string => {
  if (fullStr.length <= strLen) return fullStr;

  const sepLen = separator.length;
  const charsToShow = strLen - sepLen;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return (
    fullStr.substring(0, frontChars) +
    separator +
    fullStr.substring(fullStr.length - backChars)
  );
};

// This function generates a new random ObjectId and returns it as a string.
export const getRandomObjectId = () => {
  return new ObjectId().toString();
};

// The `assertUnreachable` function takes an input `_x` of type `never` and always throws
// an error. This function is typically used in TypeScript to assert exhaustiveness in
// switch-case or if-else constructs, ensuring that all possible cases are handled.
export const assertUnreachable = (_x: never): never => {
  // Throw an error with a message indicating that this function should not be reached.
  // This error should only be thrown if there's a bug in the code or a new case has been
  // introduced without updating the relevant switch-case or if-else constructs.
  throw new Error("Didn't expect to get here");
};

// This function takes a string value and checks if it is a valid Ethereum address.
// It returns a boolean value indicating whether the input string is a valid Ethereum address.
export function isEthereumAddress(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }
  // The regular expression used here checks if the input string starts with "0x" and is followed by
  // 40 hexadecimal characters (0-9, a-f, A-F).
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function formatNumber(num: number): string {
  
  if (num < 10) {
    return num.toFixed(3);
  } else if (num < 100) {
    return num.toFixed(2);
  } else if (num < 10000) {
    return num.toFixed(0);
  } else {
    const suffixes = ["", "k", "M", "B", "T"];
    const suffixIndex = Math.floor(Math.log10(num) / 3);
    const suffix = suffixes[suffixIndex];
    const scaledNum = num / Math.pow(10, suffixIndex * 3);
    return scaledNum.toFixed(1) + suffix;
  }
}
