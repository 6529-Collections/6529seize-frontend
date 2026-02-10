import { render, screen, fireEvent, act } from '@testing-library/react';
import DropPartMarkdownImage from '@/components/drops/view/part/DropPartMarkdownImage';
import React from 'react';

let escapeCb: () => void = () => {};

jest.mock('react-use/lib/useKeyPressEvent', () => (key: string, cb: () => void) => {
  if (key === 'Escape') escapeCb = cb;
});

jest.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: any) => <div data-testid="wrapper">{typeof children === 'function' ? children({ resetTransform: jest.fn() }) : children}</div>,
  TransformComponent: ({ children }: any) => <div data-testid="transform">{children}</div>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false }) }));

jest.mock('@/helpers/Helpers', () => ({ fullScreenSupported: () => true }));
jest.mock('@/helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => u, ImageScale: { AUTOx450: 'auto' } }));


describe('DropPartMarkdownImage', () => {
  it('opens modal on click and closes via escape', () => {
    const { container } = render(<DropPartMarkdownImage src="/img.png" alt="alt" />);
    const img = screen.getByRole('img');
    expect(container.querySelector('.tw-animate-pulse')).toBeTruthy();
    fireEvent.load(img);
    expect(container.querySelector('.tw-animate-pulse')).toBeNull();

    fireEvent.click(img);
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
    act(() => {
      escapeCb();
    });
    expect(screen.queryByRole('button', { name: 'Close modal' })).toBeNull();
  });
});
