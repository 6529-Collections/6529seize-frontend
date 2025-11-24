import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";

export interface UserPageXtdhGrantFormState {
  contract: ContractOverview | null;
  selection: NftPickerSelection | null;
  amount: number | null;
  validUntil: Date | null;
}

export interface UserPageXtdhGrantSubmissionState {
  submitError: string | null;
  submitSuccess: string | null;
  isSubmitting: boolean;
}

export interface UserPageXtdhGrantLimitsState {
  maxGrantRate: number | null;
  isMaxGrantLoading: boolean;
  isMaxGrantError: boolean;
}

export interface UserPageXtdhGrantFormControls {
  setContract: (contract: ContractOverview | null) => void;
  setSelection: (selection: NftPickerSelection | null) => void;
  setAmount: (amount: number | null) => void;
  setValidUntil: (validUntil: Date | null) => void;
  handleSubmit: () => Promise<void>;
}

export type UserPageXtdhGrantForm = UserPageXtdhGrantFormState &
  UserPageXtdhGrantSubmissionState &
  UserPageXtdhGrantLimitsState &
  UserPageXtdhGrantFormControls;

export type GrantValidationParams = UserPageXtdhGrantFormState & {
  maxGrantRate?: number | null;
};

export type GrantValidationResult =
  | { success: false; message: string }
  | {
      success: true;
      contract: ContractOverview;
      selection: NftPickerSelection;
      amount: number;
      validUntil: Date | null;
    };
