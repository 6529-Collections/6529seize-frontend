import { render, screen, act } from '@testing-library/react';
import React from 'react';
import LazyTippy from '../../../../components/utils/tooltip/LazyTippy';

let handlers: any;

jest.mock('@tippyjs/react', () => ({
  __esModule: true,
  default: ({ plugins, content, render }: any) => {
    handlers = plugins[0].fn();
    return <div data-testid="tippy">{render ? render() : content}</div>;
  },
}));

describe('LazyTippy', () => {
  it('only shows content when mounted via plugin hooks', () => {
    render(<LazyTippy content="hello" />);
    expect(screen.getByTestId('tippy').textContent).toBe('');

    act(() => handlers.onMount());
    expect(screen.getByTestId('tippy').textContent).toBe('hello');

    act(() => handlers.onHidden());
    expect(screen.getByTestId('tippy').textContent).toBe('');
  });

  it('uses render prop when provided', () => {
    render(
      <LazyTippy render={() => <span data-testid="inner">text</span>} />
    );
    act(() => handlers.onMount());
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });
});
