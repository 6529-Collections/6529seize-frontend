import type { AwsRum as AwsRumInstance } from "aws-rum-web";

// Global window type extensions
declare global {
  interface Window {
    awsRum?: AwsRumInstance;
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
    web3?: unknown;
  }
}

export {};
