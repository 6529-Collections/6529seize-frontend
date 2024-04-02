import { useContext, useState } from "react";
import {
  DropFull,
  DropFullTopRepCategory,
} from "../../../../../../entities/IDrop";

import DropListItemRepTopCategoriesCreate from "./DropListItemRepTopCategoriesCreate";
import DropListItemRepTopCategoriesItem from "./DropListItemRepTopCategoriesItem";
import { AuthContext } from "../../../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";

enum DropListCategoriesState {
  IDLE = "IDLE",
  INSERT = "INSERT",
}

export default function DropListItemRepTopCategories({
  drop,
  activeCategory,
  setActiveCategory,
}: {
  readonly drop: DropFull;
  readonly activeCategory: string;
  readonly setActiveCategory: (category: string) => void;
}) {
  const { connectionStatus } = useContext(AuthContext);
  const getCategories = (): DropFullTopRepCategory[] => {
    const repCategory = drop.top_rep_categories.find(
      (category) => category.category === "Rep"
    ) ?? {
      category: "Rep",
      rep_given: 0,
    };
    const activeCategoryItem =
      activeCategory === "Rep"
        ? null
        : drop.top_rep_categories.find(
            (category) => category.category === activeCategory
          ) ?? {
            category: activeCategory,
            rep_given: 0,
          };
    const results: DropFullTopRepCategory[] = [repCategory];
    if (activeCategoryItem) {
      results.push(activeCategoryItem);
    }
    results.push(
      ...drop.top_rep_categories.filter(
        (category) =>
          category.category !== "Rep" && category.category !== activeCategory
      )
    );
    return results;
  };

  const categories = getCategories();

  const [categoryState, setCategoryState] = useState<DropListCategoriesState>(
    DropListCategoriesState.IDLE
  );

  const onCategoryCreate = (category: string) => {
    setCategoryState(DropListCategoriesState.IDLE);
    if (category) {
      setActiveCategory(category);
    }
  };
  return (
    <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
      {categories.map((item) => (
        <DropListItemRepTopCategoriesItem
          key={item.category}
          item={item}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      ))}
      {categoryState === DropListCategoriesState.INSERT &&
        connectionStatus === ProfileConnectedStatus.HAVE_PROFILE && (
          <DropListItemRepTopCategoriesCreate
            onCategoryCreate={onCategoryCreate}
          />
        )}
      {categoryState === DropListCategoriesState.IDLE &&
        connectionStatus === ProfileConnectedStatus.HAVE_PROFILE && (
          <button
            onClick={() => setCategoryState(DropListCategoriesState.INSERT)}
            className="tw-bg-transparent tw-border-none"
          >
            Add category
          </button>
        )}
    </div>
  );
}
