import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderNameEdit from '@/components/waves/header/name/WaveHeaderNameEdit';
import { createMockApiWave } from '@/__tests__/utils/mockFactories';

// The component no longer renders the animation wrappers, so those mocks are gone.
type ModalMockProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

jest.mock(
  '@/components/waves/header/name/WaveHeaderNameEditModal',
  () =>
    function WaveHeaderNameEditModalMock({ isOpen, onClose }: ModalMockProps) {
      if (!isOpen) {
        return null;
      }
      return (
        <div data-testid="modal">
          <button onClick={onClose}>close</button>
        </div>
      );
    }
);

test('opens and closes modal', async () => {
  const user = userEvent.setup();
  render(<WaveHeaderNameEdit wave={createMockApiWave({ id: 'w1' })} />);
  expect(screen.queryByTestId('modal')).toBeNull();
  await user.click(screen.getByRole('button'));
  expect(screen.getByTestId('modal')).toBeInTheDocument();
  await user.click(screen.getByText('close'));
  expect(screen.queryByTestId('modal')).toBeNull();
});

test('exposes an accessible name and a non-hover reveal path', () => {
  render(<WaveHeaderNameEdit wave={createMockApiWave({ id: 'w1' })} />);

  const trigger = screen.getByRole('button', { name: 'Edit wave name' });
  // Renaming a wave has no other entry point, so the control must never be
  // removed from the layout — it is revealed by opacity, plus focus and
  // touch-only paths for inputs that cannot hover.
  expect(trigger.className).not.toContain('tw-hidden');
  expect(trigger.className).toContain('focus-visible:tw-opacity-100');
  expect(trigger.className).toContain('touch-only:tw-opacity-100');
});
