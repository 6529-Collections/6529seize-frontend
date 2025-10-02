import { render } from '@testing-library/react';
import React from 'react';
import GroupCreateRep from '@/components/groups/page/create/config/GroupCreateRep';
import { ApiGroupFilterDirection } from '@/generated/models/ApiGroupFilterDirection';
import { ApiCreateGroupDescription } from '@/generated/models/ApiCreateGroupDescription';

let identityProps: any = null;
let repCategoryProps: any = null;
let numericProps: any = null;
let directionProps: any = null;
let toggleProps: any = null;

jest.mock('@/components/groups/page/create/config/common/GroupCreateDirection', () => ({
  __esModule: true,
  default: (props: any) => { directionProps = props; return <div data-testid="direction" />; }
}));
jest.mock('@/components/utils/input/identity/IdentitySearch', () => ({
  __esModule: true,
  IdentitySearchSize: { MD: 'md' },
  default: (props: any) => { identityProps = props; return <div data-testid="identity" />; }
}));
jest.mock('@/components/utils/input/rep-category/RepCategorySearch', () => ({
  __esModule: true,
  RepCategorySearchSize: { MD: 'md' },
  default: (props: any) => { repCategoryProps = props; return <div data-testid="category" />; }
}));
jest.mock('@/components/groups/page/create/config/common/GroupCreateNumericValue', () => ({
  __esModule: true,
  default: (props: any) => { numericProps = props; return <div data-testid="numeric" />; }
}));
jest.mock('@/components/groups/page/create/config/rep/PositiveOnlyToggle', () => ({
  __esModule: true,
  default: (props: any) => { toggleProps = props; return <div data-testid="toggle" />; }
}));

function renderComponent(rep: ApiCreateGroupDescription['rep'], setRep: jest.Mock) {
  return render(<GroupCreateRep rep={rep} setRep={setRep} />);
}


describe('GroupCreateRep', () => {
  beforeEach(() => {
    identityProps = null;
    repCategoryProps = null;
    numericProps = null;
    directionProps = null;
    toggleProps = null;
  });

  it('renders identity search with default label when no direction', () => {
    const setRep = jest.fn();
    const rep: ApiCreateGroupDescription['rep'] = { user_identity: null, category: null, min: 1, direction: null } as any;
    const { getByTestId } = renderComponent(rep, setRep);
    expect(getByTestId('identity')).toBeInTheDocument();
    expect(identityProps.label).toBe('Identity');
    identityProps.setIdentity('alice');
    expect(setRep).toHaveBeenCalledWith({ ...rep, user_identity: 'alice' });
    numericProps.setValue(5);
    expect(setRep).toHaveBeenCalledWith({ ...rep, min: 5 });
  });

  it('shows direction component when user_identity and direction present', () => {
    const setRep = jest.fn();
    const rep: ApiCreateGroupDescription['rep'] = { user_identity: 'u1', category: 'c1', min: 0, direction: ApiGroupFilterDirection.Sent } as any;
    const { getByTestId } = renderComponent(rep, setRep);
    expect(getByTestId('direction')).toBeInTheDocument();
    expect(directionProps.direction).toBe(ApiGroupFilterDirection.Sent);
    expect(identityProps.label).toBe('To Identity');
    repCategoryProps.setCategory('new');
    expect(setRep).toHaveBeenCalledWith({ ...rep, category: 'new' });
    directionProps.setDirection(ApiGroupFilterDirection.Received);
    expect(setRep).toHaveBeenCalledWith({ ...rep, direction: ApiGroupFilterDirection.Received });
    expect(toggleProps).toBeDefined();
  });
});

