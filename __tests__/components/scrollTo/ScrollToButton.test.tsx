import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import ScrollToButton from '../../../components/scrollTo/ScrollToButton';

jest.mock('react-scroll', () => ({ Link: (props: any) => <a {...props}>{props.children}</a> }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));

describe('ScrollToButton', () => {
  it('toggles visibility based on scroll position', () => {
    const target = document.createElement('div');
    target.id = 'sec';
    Object.defineProperty(target, 'offsetTop', { value: 50, writable: true });
    document.body.appendChild(target);

    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    const { container } = render(<ScrollToButton to="sec" threshold={20} offset={0} />);
    const link = container.querySelector('a')!;
    expect(link.style.display).toBe('none');

    Object.defineProperty(window, 'pageYOffset', { value: 100, writable: true });
    fireEvent.scroll(window);
    expect(link.style.display).toBe('flex');
    document.body.removeChild(target);
  });

  it('cleans up listener on unmount', () => {
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ScrollToButton to="sec" threshold={0} offset={0} />);
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function));
    const handler = add.mock.calls.find(c => c[0] === 'scroll')![1];
    unmount();
    expect(remove).toHaveBeenCalledWith('scroll', handler);
    add.mockRestore();
    remove.mockRestore();
  });
});
