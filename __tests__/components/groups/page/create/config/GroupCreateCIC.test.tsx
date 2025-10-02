import { render } from '@testing-library/react';
import React from 'react';
import GroupCreateCIC from '@/components/groups/page/create/config/GroupCreateCIC';
import { ApiGroupFilterDirection } from '@/generated/models/ApiGroupFilterDirection';
import { ApiCreateGroupDescription } from '@/generated/models/ApiCreateGroupDescription';

let identityProps: any = null;
let numericProps: any = null;
let directionProps: any = null;

jest.mock('@/components/groups/page/create/config/common/GroupCreateDirection', () => ({
  __esModule: true,
  default: (props: any) => { directionProps = props; return <div data-testid="direction" />; }
}));

jest.mock('@/components/utils/input/identity/IdentitySearch', () => ({
  __esModule: true,
  IdentitySearchSize: { MD: 'md' },
  default: (props: any) => { identityProps = props; return <div data-testid="identity" />; }
}));

jest.mock('@/components/groups/page/create/config/common/GroupCreateNumericValue', () => ({
  __esModule: true,
  default: (props: any) => { numericProps = props; return <div data-testid="numeric" />; }
}));

function renderComponent(cic: ApiCreateGroupDescription['cic'], setCIC: jest.Mock) {
  return render(<GroupCreateCIC cic={cic} setCIC={setCIC} />);
}

describe('GroupCreateCIC', () => {
  beforeEach(() => {
    identityProps = null;
    numericProps = null;
    directionProps = null;
  });

  it('renders direction when identity and direction exist', () => {
    const setCIC = jest.fn();
    const cic = { user_identity: 'id', min: 1, direction: ApiGroupFilterDirection.Received } as any;
    const { getByTestId } = renderComponent(cic, setCIC);
    expect(getByTestId('direction')).toBeInTheDocument();
    expect(directionProps.direction).toBe(ApiGroupFilterDirection.Received);
    expect(identityProps.label).toBe('From Identity');
    directionProps.setDirection(ApiGroupFilterDirection.Sent);
    expect(setCIC).toHaveBeenCalledWith({ ...cic, direction: ApiGroupFilterDirection.Sent });
    identityProps.setIdentity('new');
    expect(setCIC).toHaveBeenCalledWith({ ...cic, user_identity: 'new' });
    numericProps.setValue(5);
    expect(setCIC).toHaveBeenCalledWith({ ...cic, min: 5 });
  });

  it('uses default identity label when direction missing', () => {
    const setCIC = jest.fn();
    const cic = { user_identity: null, min: null, direction: null } as any;
    renderComponent(cic, setCIC);
    expect(directionProps).toBeNull();
    expect(identityProps.label).toBe('Identity');
  });
});
