import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSettingsClassificationItem from '../../../../components/user/settings/UserSettingsClassificationItem';
import { ApiProfileClassification } from '../../../../generated/models/ApiProfileClassification';

const classification = ApiProfileClassification.Bot;

function renderItem(selected: ApiProfileClassification | null, handler = jest.fn()) {
  render(
    <ul>
      <UserSettingsClassificationItem
        classification={classification}
        selected={selected}
        onClassification={handler}
      />
    </ul>
  );
  return handler;
}

describe('UserSettingsClassificationItem', () => {
  it('calls onClassification when clicked', async () => {
    const handler = renderItem(null);
    const item = screen.getByText('Bot').closest('li') as HTMLElement;
    await userEvent.click(item);
    expect(handler).toHaveBeenCalledWith(classification);
  });

  it('shows check icon when selected', () => {
    renderItem(classification);
    const item = screen.getByText('Bot').closest('li') as HTMLElement;
    expect(item.querySelector('svg')).toBeInTheDocument();
  });

  it('updates active state when selected prop changes', () => {
    const { rerender } = render(
      <ul>
        <UserSettingsClassificationItem
          classification={classification}
          selected={null}
          onClassification={() => {}}
        />
      </ul>
    );
    let item = screen.getByText('Bot').closest('li') as HTMLElement;
    expect(item.querySelector('svg')).toBeNull();

    rerender(
      <ul>
        <UserSettingsClassificationItem
          classification={classification}
          selected={classification}
          onClassification={() => {}}
        />
      </ul>
    );
    item = screen.getByText('Bot').closest('li') as HTMLElement;
    expect(item.querySelector('svg')).toBeInTheDocument();
  });
});
