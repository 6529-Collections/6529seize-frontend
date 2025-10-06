import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropListItemRateGiveChangeButton from '@/components/drops/view/item/rate/give/DropListItemRateGiveChangeButton';
import { AuthContext } from '@/components/auth/Auth';
import { ProfileConnectedStatus } from '@/entities/IProfile';
import { RateChangeType } from '@/components/drops/view/item/rate/give/DropListItemRateGive';

describe('DropListItemRateGiveChangeButton', () => {
  const renderBtn = (status: ProfileConnectedStatus, canVote = true) => {
    const ctx = { connectionStatus: status } as any;
    const handleDown = jest.fn();
    const handleUp = jest.fn();
    render(
      <AuthContext.Provider value={ctx}>
        <DropListItemRateGiveChangeButton
          type={RateChangeType.INCREASE}
          canVote={canVote}
          handleMouseDown={handleDown}
          handleMouseUp={handleUp}
        />
      </AuthContext.Provider>
    );
    return { handleDown, handleUp };
  };

  it('calls handlers when voting allowed', async () => {
    const { handleDown, handleUp } = renderBtn(ProfileConnectedStatus.HAVE_PROFILE);
    const btn = screen.getByRole('button');
    await userEvent.pointer({ keys: '[MouseLeft]', target: btn });
    await userEvent.pointer({ keys: '[/MouseLeft]', target: btn });
    expect(handleDown).toHaveBeenCalledWith(RateChangeType.INCREASE);
    expect(handleUp).toHaveBeenCalled();
  });

  it('ignores clicks when no profile', async () => {
    const { handleDown, handleUp } = renderBtn(ProfileConnectedStatus.NO_PROFILE);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(handleDown).not.toHaveBeenCalled();
    expect(handleUp).not.toHaveBeenCalled();
  });
});
