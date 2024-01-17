import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { commonApiPost } from "../../../../../services/api/common-api";
import {
  ApiCreateOrUpdateProfileCicStatement,
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "../../../../../helpers/Types";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "../../../../auth/Auth";

export default function UserPageIdentityStatementsAboutEdit({
  profile,
  statement,
  onClose,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly statement: CicStatement | null;
  readonly onClose: () => void;
}) {
  const MAX_STATEMENT_LENGTH = 500;

  const { onProfileStatementAdd } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast } = useContext(AuthContext);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const { value } = inputRef.current;
      inputRef.current.setSelectionRange(value.length, value.length);
    }
  }, []);

  const [value, setValue] = useState<string>(statement?.statement_value ?? "");

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    if (newValue.length > MAX_STATEMENT_LENGTH) {
      setValue(newValue.substring(0, MAX_STATEMENT_LENGTH));
      return;
    }
    setValue(newValue);
  };

  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!value) {
      setIsDisabled(true);
      return;
    }

    if (statement?.statement_value === value) {
      setIsDisabled(true);
      return;
    }

    if (loading) {
      setIsDisabled(true);
      return;
    }

    setIsDisabled(false);
  }, [value, statement, loading]);

  const addStatementMutation = useMutation({
    mutationFn: async (statement: string) => {
      setLoading(true);
      return await commonApiPost<
        ApiCreateOrUpdateProfileCicStatement,
        CicStatement
      >({
        endpoint: `profiles/${profile.profile?.handle}/cic/statements`,
        body: {
          statement_group: STATEMENT_GROUP.GENERAL,
          statement_type: STATEMENT_TYPE.BIO,
          statement_comment: null,
          statement_value: statement,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: "About statement added.",
        type: "success",
      });
      onProfileStatementAdd({
        profile,
      });
      onClose();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value) return;
    const { success } = await requestAuth();
    if (!success) return;
    await addStatementMutation.mutateAsync(value);
  };

  return (
    <form onSubmit={onSubmit}>
      <textarea
        className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-4 tw-pr-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-600 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        name="profile-about"
        id="profile-about-input"
        cols={30}
        rows={10}
        required
        value={value}
        onChange={handleInputChange}
        ref={inputRef}
        style={{ resize: "none" }}
      ></textarea>
      <div className="tw-inline-flex tw-w-full tw-justify-between">
        <div className="tw-text-sm tw-text-iron-500">
          {value.length}/{MAX_STATEMENT_LENGTH}
        </div>
        <button
          disabled={isDisabled}
          type="submit"
          className={`tw-mt-3 tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out ${
            isDisabled
              ? "tw-cursor-not-allowed tw-bg-iron-400 tw-border-iron-400"
              : "tw-cursor-pointer tw-bg-primary-500 tw-border-primary-500 hover:tw-bg-primary-600 hover:tw-border-primary-600"
          }`}
        >
          <div style={{ visibility: loading ? "hidden" : "visible" }}>Save</div>
          {loading && (
            <svg
              aria-hidden="true"
              role="output"
              className="tw-inline tw-w-5 tw-h-5 tw-text-primary-400 tw-animate-spin tw-absolute"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="tw-text-neutral-600"
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              ></path>
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentColor"
              ></path>
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
