import { render, screen, fireEvent } from '@testing-library/react';
import { printViewButton, ContentView } from '../../../../../components/nextGen/collections/collectionParts/NextGenCollection';

describe('printViewButton', () => {
  it('highlights current view and triggers setView on click', () => {
    const setView = jest.fn();
    render(printViewButton(ContentView.ABOUT, ContentView.ABOUT, setView));
    const button = screen.getByRole('button');
    expect(button.className).toMatch(/nextgenTokenDetailsLinkSelected/);
    expect(screen.getByText('About')).toHaveClass('font-color');
    fireEvent.click(button);
    expect(setView).toHaveBeenCalledWith(ContentView.ABOUT);
  });

  it('renders unselected state and calls setView with provided value', () => {
    const setView = jest.fn();
    render(printViewButton(ContentView.ABOUT, ContentView.PROVENANCE, setView));
    const button = screen.getByRole('button');
    expect(button.className).not.toMatch(/nextgenTokenDetailsLinkSelected/);
    expect(screen.getByText('Provenance')).toHaveClass('font-color-h cursor-pointer');
    fireEvent.click(button);
    expect(setView).toHaveBeenCalledWith(ContentView.PROVENANCE);
  });
});
