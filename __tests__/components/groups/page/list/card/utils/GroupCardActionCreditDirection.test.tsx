import { render, fireEvent } from '@testing-library/react';
import GroupCardActionCreditDirection from '../../../../../../../components/groups/page/list/card/utils/GroupCardActionCreditDirection';
import { CreditDirection } from '../../../../../../../components/groups/page/list/card/GroupCard';

describe('GroupCardActionCreditDirection', () => {
  it('calls setCreditDirection on clicks', () => {
    const setCreditDirection = jest.fn();
    const { getAllByRole } = render(
      <GroupCardActionCreditDirection
        creditDirection={CreditDirection.ADD}
        setCreditDirection={setCreditDirection}
      />
    );
    const [subtractBtn, addBtn] = getAllByRole('button');
    fireEvent.click(subtractBtn);
    fireEvent.click(addBtn);
    expect(setCreditDirection).toHaveBeenNthCalledWith(1, CreditDirection.SUBTRACT);
    expect(setCreditDirection).toHaveBeenNthCalledWith(2, CreditDirection.ADD);
  });
});
