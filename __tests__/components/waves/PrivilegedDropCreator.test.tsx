import { render, screen } from '@testing-library/react';
import React from 'react';
import PrivilegedDropCreator, { DropMode } from '../../../components/waves/PrivilegedDropCreator';
import { useDropPrivileges } from '../../../hooks/useDropPriviledges';
import { useAuth } from '../../components/auth/Auth';

jest.mock('../../../hooks/useDropPriviledges');
jest.mock('../../../components/auth/Auth', () => ({ useAuth: () => ({}) }));
jest.mock('../../../components/waves/DropPlaceholder', () => ({ __esModule: true, default: (props: any) => <div data-testid="placeholder" data-type={props.type} /> }));
jest.mock('../../../components/waves/CreateDrop', () => ({ __esModule: true, default: () => <div data-testid="create" /> }));

const mockPriv = useDropPrivileges as jest.Mock;
const wave: any = { chat: { authenticated_user_eligible: true, enabled: true }, participation: { authenticated_user_eligible: true }, metrics:{} };

describe('PrivilegedDropCreator', () => {
  it('shows both placeholder when both restricted', () => {
    mockPriv.mockReturnValue({ submissionRestriction: 'SUB', chatRestriction: 'CHAT' });
    render(<PrivilegedDropCreator activeDrop={null} onCancelReplyQuote={()=>{}} onDropAddedToQueue={()=>{}} wave={wave} dropId={null} fixedDropMode={DropMode.BOTH} />);
    expect(screen.getByTestId('placeholder')).toHaveAttribute('data-type','both');
  });

  it('shows chat placeholder when chat restricted', () => {
    mockPriv.mockReturnValue({ submissionRestriction: null, chatRestriction: 'CHAT' });
    render(<PrivilegedDropCreator activeDrop={null} onCancelReplyQuote={()=>{}} onDropAddedToQueue={()=>{}} wave={wave} dropId={null} fixedDropMode={DropMode.CHAT} />);
    expect(screen.getByTestId('placeholder')).toHaveAttribute('data-type','chat');
  });

  it('shows submission placeholder when submission restricted', () => {
    mockPriv.mockReturnValue({ submissionRestriction: 'SUB', chatRestriction: null });
    render(<PrivilegedDropCreator activeDrop={null} onCancelReplyQuote={()=>{}} onDropAddedToQueue={()=>{}} wave={wave} dropId={null} fixedDropMode={DropMode.PARTICIPATION} />);
    expect(screen.getByTestId('placeholder')).toHaveAttribute('data-type','submission');
  });

  it('renders CreateDrop when allowed', () => {
    mockPriv.mockReturnValue({ submissionRestriction: null, chatRestriction: null });
    render(<PrivilegedDropCreator activeDrop={null} onCancelReplyQuote={()=>{}} onDropAddedToQueue={()=>{}} wave={wave} dropId={null} fixedDropMode={DropMode.BOTH} />);
    expect(screen.getByTestId('create')).toBeInTheDocument();
  });
});
