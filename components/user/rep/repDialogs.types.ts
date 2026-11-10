import type { RepDirection } from "./UserPageRep.helpers";

type RepContributorsDialogState =
  | {
      readonly scope: "overview";
      readonly direction: RepDirection;
      readonly contributorCount: number;
    }
  | {
      readonly scope: "category";
      readonly direction: RepDirection;
      readonly category: string;
      readonly contributorCount: number;
    };

export type RepDialogState =
  | ({
      readonly type: "contributors";
    } & RepContributorsDialogState)
  | {
      readonly type: "globalCategory";
      readonly category: string;
    };
