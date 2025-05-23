import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import AllowlistToolAnimationOpacity from '../../../components/allowlist-tool/common/animation/AllowlistToolAnimationOpacity';

describe('AllowlistToolAnimationOpacity', () => {
  it('renders with provided role and classes', () => {
    const { getByRole } = render(
      <AllowlistToolAnimationOpacity elementRole="alert" elementClasses="tw-o-test">
        hi
      </AllowlistToolAnimationOpacity>
    );
    const div = getByRole('alert');
    expect(div).toHaveClass('tw-o-test');
    expect(div.textContent).toBe('hi');
  });

  it('fires onClicked handler', () => {
    const onClicked = jest.fn();
    const { getByRole } = render(
      <AllowlistToolAnimationOpacity elementRole="note" onClicked={onClicked}>
        click
      </AllowlistToolAnimationOpacity>
    );
    fireEvent.click(getByRole('note'));
    expect(onClicked).toHaveBeenCalled();
  });
});
