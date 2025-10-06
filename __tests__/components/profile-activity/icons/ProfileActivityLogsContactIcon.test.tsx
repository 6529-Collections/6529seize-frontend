import { render } from '@testing-library/react';
import React from 'react';
import ProfileActivityLogsContactIcon from '@/components/profile-activity/icons/ProfileActivityLogsContactIcon';

describe('ProfileActivityLogsContactIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<ProfileActivityLogsContactIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });
});
