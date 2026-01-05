import type {
  ContractOverview,
  NftPickerChange,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";

export interface UserPageXtdhGrantFormState {
  contract: ContractOverview | null;
  selection: NftPickerChange;
  amount: number | null;
  validUntil: Date | null;
  formKey: number;
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
  setSelection: (selection: NftPickerChange) => void;
  setAmount: (amount: number | null) => void;
  setValidUntil: (validUntil: Date | null) => void;
  handleSubmit: () => Promise<void>;
}

export type UserPageXtdhGrantForm = UserPageXtdhGrantFormState &
  UserPageXtdhGrantSubmissionState &
  UserPageXtdhGrantLimitsState &
  UserPageXtdhGrantFormControls;

export type GrantValidationParams = UserPageXtdhGrantFormState & {
  maxGrantRate?: number | null | undefined;
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
