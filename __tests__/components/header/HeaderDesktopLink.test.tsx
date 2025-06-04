import { render, screen } from '@testing-library/react';
import React from 'react';
import HeaderDesktopLink from '../../../components/header/HeaderDesktopLink';

jest.mock('react-bootstrap', () => ({ NavDropdown: { Item: (p:any) => <div data-testid="item">{p.children}</div> } }));
jest.mock('../../../components/header/Header.module.scss', () => ({ new: 'new' }));

describe('HeaderDesktopLink', () => {
  it('renders link with new label', () => {
    const link = { name:'Home', path:'/home', isNew:true };
    render(<HeaderDesktopLink link={link} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });
});
