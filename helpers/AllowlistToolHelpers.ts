export class ObjectId {
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
