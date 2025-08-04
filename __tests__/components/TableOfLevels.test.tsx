import { render, screen, within } from '@testing-library/react';
import TableOfLevels from '../../components/levels/TableOfLevels';
import levels from '../../levels.json';

describe('TableOfLevels', () => {
  // Mock toLocaleString to ensure consistent behavior across different locales
  beforeEach(() => {
    const originalToLocaleString = Number.prototype.toLocaleString;
    jest.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function(this: number, locales?: string | string[], options?: Intl.NumberFormatOptions) {
      return originalToLocaleString.call(this, 'en-US', options);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('renders a row for each level with the correct values', () => {
    render(<TableOfLevels />);
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // header row + one row per level
    expect(rows).toHaveLength(levels.length + 1);

    // check first and last rows
    const firstRowCells = within(rows[1]).getAllByRole('cell');
    expect(firstRowCells[0]).toHaveTextContent('0');
    expect(firstRowCells[1]).toHaveTextContent('0');

    const lastRowCells = within(rows[rows.length - 1]).getAllByRole('cell');
    const last = levels[levels.length - 1];
    expect(lastRowCells[0]).toHaveTextContent(last.level.toString());
    expect(lastRowCells[1]).toHaveTextContent(last.threshold.toLocaleString('en-US'));
  });
});
