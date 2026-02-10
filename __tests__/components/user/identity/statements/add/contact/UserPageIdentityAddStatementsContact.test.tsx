import { render } from '@testing-library/react';
import { act } from '@testing-library/react';
import React from 'react';
import UserPageIdentityAddStatementsContact from '@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContact';
import { STATEMENT_TYPE, STATEMENT_GROUP } from '@/helpers/Types';

let headerProps: any;
let itemsProps: any;
let formProps: any;

jest.mock('@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContactHeader', () => (props: any) => {
  headerProps = props;
  return <div data-testid="header" />;
});

jest.mock('@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContactItems', () => (props: any) => {
  itemsProps = props;
  return <div data-testid="items" />;
});

jest.mock('@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm', () => (props: any) => {
  formProps = props;
  return <div data-testid="form" />;
});

describe('UserPageIdentityAddStatementsContact', () => {
  const profile = { id: 'p1' } as any;
  const onClose = jest.fn();

  beforeEach(() => {
    headerProps = undefined;
    itemsProps = undefined;
    formProps = undefined;
  });

  it('passes props and updates active type', () => {
    render(<UserPageIdentityAddStatementsContact profile={profile} onClose={onClose} />);

    expect(headerProps.onClose).toBe(onClose);
    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.DISCORD);
    expect(typeof itemsProps.setContactType).toBe('function');

    expect(formProps.group).toBe(STATEMENT_GROUP.CONTACT);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.DISCORD);
    expect(formProps.profile).toBe(profile);

    act(() => {
      itemsProps.setContactType(STATEMENT_TYPE.TELEGRAM);
    });

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.TELEGRAM);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.TELEGRAM);
  });
});
