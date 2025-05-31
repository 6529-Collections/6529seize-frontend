import { render, screen } from '@testing-library/react';
import { CountdownDisplay } from '../../../../components/waves/drop/CountdownDisplay';

it('shows time remaining with default labels', () => {
  render(
    <CountdownDisplay
      headerText="Time"
      timeRemaining={{ days: 1, hours: 2, minutes: 3, seconds: 4 }}
    />
  );
  expect(screen.getByText('Time')).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText('Hrs')).toBeInTheDocument();
});
