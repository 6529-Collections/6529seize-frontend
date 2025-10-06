import userEvent from "@testing-library/user-event";
import { render, screen } from '@testing-library/react';
import ProxyCreateActionSelectType from '@/components/user/proxy/proxy/create-action/select-type/ProxyCreateActionSelectType';
import { ApiProfileProxyActionType } from '@/generated/models/ApiProfileProxyActionType';

jest.mock('@/components/user/proxy/proxy/create-action/select-type/ProxyCreateActionSelectTypeItem', () => (props: any) => (
  <div data-testid="item" onClick={() => props.setSelectedActionType(props.actionType)}>{props.actionType}</div>
));

describe('ProxyCreateActionSelectType', () => {
  it('filters out unavailable actions', () => {
    const current = [{ action_type: ApiProfileProxyActionType.AllocateRep }];
    render(
      <ProxyCreateActionSelectType currentActions={current as any} setSelectedActionType={jest.fn()} />
    );
    const items = screen.getAllByTestId('item');
    // PROFILE_PROXY_AVAILABLE_ACTIONS only contains AllocateRep and AllocateCic
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(ApiProfileProxyActionType.AllocateCic);
  });

  it('selects action type when item clicked', async () => {
    const setSelected = jest.fn();
    render(
      <ProxyCreateActionSelectType currentActions={[]} setSelectedActionType={setSelected} />
    );
    const item = screen.getAllByTestId('item')[0];
    await userEvent.click(item);
    expect(setSelected).toHaveBeenCalledWith(item.textContent);
  });
it('calls onCancel when cancel button clicked', async () => {
  const onCancel = jest.fn();
  render(
    <ProxyCreateActionSelectType
      currentActions={[] as any}
      setSelectedActionType={jest.fn()}
      onCancel={onCancel}
    />
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Cancel' })
  );
  expect(onCancel).toHaveBeenCalled();
});
});
