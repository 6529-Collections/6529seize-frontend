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

  export const getRandomObjectId = () => {
    return new ObjectId().toString();
  }