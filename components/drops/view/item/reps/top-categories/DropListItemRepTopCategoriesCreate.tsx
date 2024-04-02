import { useState } from "react";
import PrimaryButton from "../../../../../utils/buttons/PrimaryButton";

export default function DropListItemRepTopCategoriesCreate({
  onCategoryCreate,
}: {
  readonly onCategoryCreate: (category: string) => void;
}) {
  const [category, setCategory] = useState<string>("");
  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setCategory(newValue);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCategoryCreate(category);
  };
  return (
    <form onSubmit={onSubmit} className="tw-inline-flex tw-space-x-4">
      <input
        name="create-cateogry"
        type="text"
        autoComplete="off"
        value={category}
        onChange={handleCategoryChange}
        className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pr-4 tw-bg-iron-950 focus:tw-bg-iron-950  tw-text-iron-300 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none  focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-transition tw-duration-300 tw-ease-out"
        placeholder="Category"
      />
      <PrimaryButton type="submit">Create</PrimaryButton>
    </form>
  );
}
