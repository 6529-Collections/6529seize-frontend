import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import GroupCreateIdentitiesSelect from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSelect";
import type { CommunityMemberMinimal } from "@/entities/IProfile";

let searchProps: any;
jest.mock(
  "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch",
  () => (props: any) => {
    searchProps = props;
    return (
      <button
        data-testid="search"
        onClick={() => props.onIdentitySelect({ wallet: "w1", handle: "h1" })}
      />
    );
  }
);
let itemsProps: any;
jest.mock(
  "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems",
  () => (props: any) => {
    itemsProps = props;
    return <div data-testid="items" onClick={() => props.onRemove("w1")}></div>;
  }
);

describe("GroupCreateIdentitiesSelect", () => {
  it("uses the shared darker panel border in the group form", () => {
    const { container } = render(
      <GroupCreateIdentitiesSelect
        onIdentitySelect={jest.fn()}
        selectedIdentities={[]}
        selectedWallets={[]}
        onRemove={jest.fn()}
      />
    );

    expect(container.firstElementChild).toHaveClass("tw-border-iron-900");
  });

  it("passes props to children and handles events", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onRemove = jest.fn();
    const identities: CommunityMemberMinimal[] = [
      { wallet: "w2", handle: "h2" } as any,
    ];
    render(
      <GroupCreateIdentitiesSelect
        onIdentitySelect={onSelect}
        selectedIdentities={identities}
        selectedWallets={["w2"]}
        onRemove={onRemove}
        appearance="modal"
        resultsLayout="inline"
      />
    );
    await user.click(screen.getByTestId("search"));
    expect(screen.getByText("Search Identity")).toHaveClass("tw-m-0");
    expect(onSelect).toHaveBeenCalledWith({ wallet: "w1", handle: "h1" });
    expect(searchProps.selectedWallets).toEqual(["w2"]);
    expect(searchProps.appearance).toBe("modal");
    expect(searchProps.hideLabel).toBe(true);
    expect(searchProps.placeholder).toBe("Identity");
    expect(searchProps.resultsLayout).toBe("inline");
    await user.click(screen.getByTestId("items"));
    expect(onRemove).toHaveBeenCalledWith("w1");
    expect(itemsProps.selectedIdentities).toBe(identities);
    expect(itemsProps.variant).toBe("inline");
  });
});
