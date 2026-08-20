import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderNameEdit from '@/components/waves/header/name/WaveHeaderNameEdit';

jest.mock('@/components/utils/animation/CommonAnimationWrapper', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('@/components/utils/animation/CommonAnimationOpacity', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

let closeFn: () => void;
jest.mock('@/components/waves/header/name/WaveHeaderNameEditModal', () => (props: any) => {
  closeFn = props.onClose;
  if (!props.isOpen) {
    return null;
  }
  return <div data-testid="modal"><button onClick={props.onClose}>close</button></div>;
});

test('opens and closes modal', async () => {
  const user = userEvent.setup();
  render(<WaveHeaderNameEdit wave={{ id: 'w1' } as any} />);
  expect(screen.queryByTestId('modal')).toBeNull();
  await user.click(screen.getByRole('button'));
  expect(screen.getByTestId('modal')).toBeInTheDocument();
  await user.click(screen.getByText('close'));
  expect(screen.queryByTestId('modal')).toBeNull();
});

test('exposes an accessible name and a non-hover reveal path', () => {
  render(<WaveHeaderNameEdit wave={{ id: 'w1' } as any} />);

  const trigger = screen.getByRole('button', { name: 'Edit wave name' });
  // Renaming a wave has no other entry point, so the control must never be
  // removed from the layout — it is revealed by opacity, plus focus and
  // touch-only paths for inputs that cannot hover.
  expect(trigger.className).not.toContain('tw-hidden');
  expect(trigger.className).toContain('focus-visible:tw-opacity-100');
  expect(trigger.className).toContain('touch-only:tw-opacity-100');
});
