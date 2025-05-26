import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const consent = jest.fn();

jest.mock('../../../components/eula/EULAConsentContext', () => ({
  useEULAConsent: () => ({ consent })
}));

const EULAModal = require('../../../components/eula/EULAModal').default;

describe('EULAModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('disables Agree button until scrolled to bottom', () => {
    const { unmount, container } = render(<EULAModal />);
    const button = screen.getByRole('button', { name: /agree/i });
    expect(button).toBeDisabled();

    const list = screen.getByRole('list');
    const scrollContainer = list.parentElement as HTMLDivElement;
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, configurable: true });
    scrollContainer.scrollTop = 100;
    fireEvent.scroll(scrollContainer);
    expect(button).not.toBeDisabled();

    unmount();
  });

  it('scrolls to bottom when arrow button clicked', () => {
    const { container } = render(<EULAModal />);
    const list = screen.getByRole('list');
    const scrollContainer = list.parentElement as HTMLDivElement;
    scrollContainer.scrollTo = jest.fn();
    const arrowButton = container.querySelector('button') as HTMLButtonElement;
    fireEvent.click(arrowButton);
    expect(scrollContainer.scrollTo).toHaveBeenCalled();
  });

  it('locks and restores body scrolling on mount and unmount', () => {
    const originalOverflow = document.body.style.overflow;
    const { unmount } = render(<EULAModal />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });
});
