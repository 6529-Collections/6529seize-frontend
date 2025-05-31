import { render } from '@testing-library/react';
import React from 'react';
import Icon from '../../../../components/profile-activity/icons/ProfileActivityLogsProxyCreatedIcon';

describe('ProfileActivityLogsProxyCreatedIcon', () => {
  it('renders svg with viewBox', () => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});
