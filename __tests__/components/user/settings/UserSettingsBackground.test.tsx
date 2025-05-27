import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSettingsBackground from '../../../../components/user/settings/UserSettingsBackground';

describe('UserSettingsBackground', () => {
  it('updates colors and handles icon clicks', async () => {
    const setBgColor1 = jest.fn();
    const setBgColor2 = jest.fn();
    const { container } = render(
      <UserSettingsBackground
        bgColor1="#000000"
        bgColor2="#ffffff"
        setBgColor1={setBgColor1}
        setBgColor2={setBgColor2}
      />
    );

    const input1 = container.querySelector('input#bgColor1') as HTMLInputElement;
    const input2 = container.querySelector('input#bgColor2') as HTMLInputElement;

    fireEvent.change(input1, { target: { value: '#123456' } });
    fireEvent.change(input2, { target: { value: '#654321' } });
    expect(setBgColor1).toHaveBeenLastCalledWith('#123456');
    expect(setBgColor2).toHaveBeenLastCalledWith('#654321');

  });
});
