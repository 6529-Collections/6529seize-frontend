import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SeasonsDropdown from '@/components/seasons-dropdown/SeasonsDropdown';

const seasons = [1, 2, 3];

it('displays selected season and calls setter', async () => {
  const setSelected = jest.fn();
  const user = userEvent.setup();
  render(<SeasonsDropdown seasons={seasons} selectedSeason={2} setSelectedSeason={setSelected} />);
  expect(screen.getByText('SZN: 2')).toBeInTheDocument();
  
  // Click on the dropdown toggle to open the menu
  await user.click(screen.getByRole('button'));
  
  // Then click on the SZN3 option
  await user.click(screen.getByText('SZN3'));
  expect(setSelected).toHaveBeenCalledWith(3);
});
