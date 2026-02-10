import { render, screen } from '@testing-library/react';
import React from 'react';
import UserCICStatus, { CIC_META } from '@/components/user/utils/user-cic-status/UserCICStatus';
import { CICType } from '@/entities/IProfile';

test('renders status text and class', () => {
  render(<UserCICStatus cic={15000} />); // ACCURATE
  const span = screen.getByText(CIC_META[CICType.ACCURATE].title);
  expect(span).toHaveClass(CIC_META[CICType.ACCURATE].class);
});

test('updates when cic prop changes', () => {
  const { rerender } = render(<UserCICStatus cic={15000} />);
  rerender(<UserCICStatus cic={-50} />);
  const span = screen.getByText(CIC_META[CICType.INACCURATE].title);
  expect(span).toHaveClass(CIC_META[CICType.INACCURATE].class);
});
