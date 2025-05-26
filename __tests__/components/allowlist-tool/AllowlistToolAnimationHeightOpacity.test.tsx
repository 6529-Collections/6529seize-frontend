import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AllowlistToolAnimationHeightOpacity from '../../../components/allowlist-tool/common/animation/AllowlistToolAnimationHeightOpacity';

// Mock framer-motion motion.div to inspect props
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn((props: any) => <div data-testid="motion-div" {...props} />)
  }
}));

const { motion } = require('framer-motion');

describe('AllowlistToolAnimationHeightOpacity', () => {
  it('renders children with provided role and class and handles click', () => {
    const handleClick = jest.fn();
    render(
      <AllowlistToolAnimationHeightOpacity elementRole="row" elementClasses="my-class" onClicked={handleClick}>
        <span>Content</span>
      </AllowlistToolAnimationHeightOpacity>
    );

    const div = screen.getByTestId('motion-div');
    expect(div).toHaveClass('my-class');
    expect(div).toHaveAttribute('role', 'row');
    expect(div).toHaveTextContent('Content');

    fireEvent.click(div);
    expect(handleClick).toHaveBeenCalled();
  });

  it('passes framer-motion props correctly', () => {
    render(
      <AllowlistToolAnimationHeightOpacity>
        <span>child</span>
      </AllowlistToolAnimationHeightOpacity>
    );

    const props = (motion.div as jest.Mock).mock.calls[0][0];
    expect(props.initial).toEqual({ height: '0', opacity: 0 });
    expect(props.animate).toEqual({
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.3, delay: 0.3 },
      },
    });
    expect(props.exit).toEqual({
      height: '0',
      opacity: 0,
      transition: {
        opacity: { duration: 0 },
        height: { duration: 0.3 },
      },
    });
  });
});
