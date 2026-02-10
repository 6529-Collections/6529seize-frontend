import { render } from '@testing-library/react';
import React from 'react';
import Icon from '@/components/profile-activity/icons/ProfileActivityLogsProfileArchivedIcon';

test('renders svg element', () => {
  const { container } = render(<Icon />);
  const svg = container.querySelector('svg');
  expect(svg).toBeInTheDocument();
  expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
});

