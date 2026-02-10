import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES, STATEMENT_TYPE } from '@/helpers/Types';

let buttonProps: any[] = [];

jest.mock('@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton', () => (props: any) => {
  buttonProps.push(props);
  return <button data-testid={props.statementType} onClick={props.onClick} />;
});

const Component = require('@/components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccountItems').default;

describe('UserPageIdentityAddStatementsSocialMediaAccountItems', () => {
  beforeEach(() => { buttonProps = []; });

  it('renders buttons and handles click', async () => {
    const setType = jest.fn();
    render(<Component activeType={STATEMENT_TYPE.X} setSocialType={setType} />);
    expect(buttonProps).toHaveLength(SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.length);
    await userEvent.click(screen.getByTestId(STATEMENT_TYPE.GITHUB));
    expect(setType).toHaveBeenCalledWith(STATEMENT_TYPE.GITHUB);
  });
});
