import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const seizeCtx = { isConnected: false, seizeConnect: jest.fn(), seizeConnectOpen: false };
jest.mock('../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => seizeCtx }));

import DelegationCenterComponent from '../../../components/delegation/DelegationCenter';
import { DelegationCenterSection } from '../../../components/delegation/DelegationCenterMenu';

jest.mock('next/image', () => ({ __esModule: true, default: (p:any) => <img {...p}/> }));
jest.mock('react-bootstrap', () => ({ Container:(p:any)=><div>{p.children}</div>, Row:(p:any)=><div>{p.children}</div>, Col:(p:any)=><div>{p.children}</div> }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg /> }));

describe('DelegationCenterComponent', () => {
  beforeEach(() => { jest.clearAllMocks(); seizeCtx.isConnected = false; });
  it('triggers wallet connect when not connected', () => {
    const setSection = jest.fn();
    render(<DelegationCenterComponent setSection={setSection} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delegation' }));
    expect(seizeCtx.seizeConnect).toHaveBeenCalled();
    expect(setSection).not.toHaveBeenCalled();
  });

  it('navigates to register delegation when connected', async () => {
    seizeCtx.isConnected = true;
    const setSection = jest.fn();
    render(<DelegationCenterComponent setSection={setSection} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delegation' }));
    await waitFor(() => expect(setSection).toHaveBeenCalledWith(DelegationCenterSection.REGISTER_DELEGATION));
  });
});
