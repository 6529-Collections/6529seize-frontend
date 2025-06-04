import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageRepRepsTable, { RepsTableSort } from '../../../../../../components/user/rep/reps/table/UserPageRepRepsTable';

let latestReps: any[] = [];
jest.mock('../../../../../../components/user/rep/reps/table/UserPageRepRepsTableBody', () => (props: any) => { latestReps = props.reps; return <tbody data-testid="body" />; });
jest.mock('../../../../../../components/user/rep/reps/table/UserPageRepRepsTableHeader', () => (props: any) => (
  <thead>
    <tr>
      <th><button onClick={() => props.onSortTypeClick(RepsTableSort.REP)}>rep</button></th>
      <th><button onClick={() => props.onSortTypeClick(RepsTableSort.RATERS)}>raters</button></th>
      <th><button onClick={() => props.onSortTypeClick(RepsTableSort.MY_RATES)}>my</button></th>
    </tr>
  </thead>
));

const reps = [
  { category: 'a', rating: 1, contributor_count: 2, rater_contribution: 5 },
  { category: 'b', rating: 3, contributor_count: 1, rater_contribution: 0 }
];

it('sorts by rating descending by default and toggles sort on header click', async () => {
  render(<table><UserPageRepRepsTable reps={[...reps]} profile={{} as any} canEditRep={true} /></table>);
  expect(latestReps[0].category).toBe('b'); // rating 3 first
  await userEvent.click(screen.getByText('raters'));
  expect(latestReps[0].category).toBe('a'); // contributor_count 2 first
});

it('reverts to REP sort when MY_RATES clicked without permission', async () => {
  render(<table><UserPageRepRepsTable reps={[...reps]} profile={{} as any} canEditRep={false} /></table>);
  await userEvent.click(screen.getByText('my'));
  expect(latestReps[0].category).toBe('b'); // should remain REP DESC
});
