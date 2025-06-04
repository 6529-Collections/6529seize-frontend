import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import TelegramIcon from '../../../../../components/user/utils/icons/TelegramIcon';

describe('TelegramIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<TelegramIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
    expect(svg).toHaveClass('tw-w-full tw-h-full tw-align-top');
  });
});
