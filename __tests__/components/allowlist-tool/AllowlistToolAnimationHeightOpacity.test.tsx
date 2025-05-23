import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import AllowlistToolAnimationHeightOpacity from '../../../components/allowlist-tool/common/animation/AllowlistToolAnimationHeightOpacity';

describe('AllowlistToolAnimationHeightOpacity', () => {
  it('renders children and classes', () => {
    const { getByRole } = render(
      <AllowlistToolAnimationHeightOpacity elementRole="status" elementClasses="tw-test">
        <span>child</span>
      </AllowlistToolAnimationHeightOpacity>
    );
    const div = getByRole('status');
    expect(div).toHaveClass('tw-test');
    expect(div.textContent).toBe('child');
  });

  it('calls onClicked when clicked', () => {
    const onClicked = jest.fn();
    const { getByRole } = render(
      <AllowlistToolAnimationHeightOpacity elementRole="button" onClicked={onClicked}>
        click me
      </AllowlistToolAnimationHeightOpacity>
    );
    fireEvent.click(getByRole('button'));
    expect(onClicked).toHaveBeenCalled();
  });
});
