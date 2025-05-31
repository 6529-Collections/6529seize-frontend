import { render, screen } from '@testing-library/react';
import ProxyActions from '../../../../../../components/user/proxy/proxy/list/ProxyActions';
import { Time } from '../../../../../../helpers/time';

jest.mock('../../../../../../components/user/proxy/proxy/list/ProxyActionRow', () => (props: any) => (
  <div data-testid="row">{props.action.id}</div>
));

const baseProfile = { id: 'p1' } as any;

function buildAction(id: string, start: number, end: number | null) {
  return {
    id,
    start_time: start,
    end_time: end,
  } as any;
}

describe('ProxyActions', () => {
  beforeEach(() => {
    jest.spyOn(Time, 'currentMillis').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sorts actions with active ones first and by start time', () => {
    const actions = [
      buildAction('a1', 100, null),
      buildAction('a2', 200, null),
      buildAction('a3', 300, 800),
      buildAction('a4', 400, 700),
    ];
    render(
      <ProxyActions profileProxy={{ actions } as any} profile={baseProfile} isSelf={false} />
    );
    const ids = screen.getAllByTestId('row').map((e) => e.textContent);
    expect(ids).toEqual(['a2', 'a1', 'a3', 'a4']);
  });

  it('orders expired actions by descending end time', () => {
    const actions = [
      buildAction('a1', 100, 500),
      buildAction('a2', 200, 800),
      buildAction('a3', 300, 700),
    ];
    render(
      <ProxyActions profileProxy={{ actions } as any} profile={baseProfile} isSelf={true} />
    );
    const ids = screen.getAllByTestId('row').map((e) => e.textContent);
    expect(ids).toEqual(['a2', 'a3', 'a1']);
  });
});
