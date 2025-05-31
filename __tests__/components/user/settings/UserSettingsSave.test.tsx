import { render } from '@testing-library/react';
import UserSettingsSave from '../../../../components/user/settings/UserSettingsSave';

describe('UserSettingsSave', () => {
  it('disables button when loading or disabled', () => {
    const { rerender, container } = render(
      <UserSettingsSave loading={true} disabled={false} />
    );
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(container.querySelector('svg')).toBeInTheDocument();

    rerender(<UserSettingsSave loading={false} disabled={true} />);
    expect(button.disabled).toBe(true);

    rerender(<UserSettingsSave loading={false} disabled={false} />);
    expect(button.disabled).toBe(false);
  });
});
