import React from "react";
import { render } from "@testing-library/react";
import { faFire, faCartPlus, faGasPump } from "@fortawesome/free-solid-svg-icons";
import LatestActivityRow, { printRoyalties, printGas } from "@/components/latest-activity/LatestActivityRow";
import { MANIFOLD } from "@/constants";

jest.mock('next/image', () => ({ __esModule: true, default: (p:any) => <img {...p}/> }));
const iconMock = jest.fn();
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any) => { iconMock(p); return <svg data-testid="icon" />; } }));
jest.mock('react-bootstrap', () => ({ Container:(p:any)=><div data-testid="container">{p.children}</div>, Row:(p:any)=><div>{p.children}</div>, Col:(p:any)=><div>{p.children}</div> }));
jest.mock("@/components/address/Address", () => (p:any) => <span>{p.display}</span>);

jest.mock("@/helpers/Helpers", () => ({
  areEqualAddresses: (a:string,b:string)=>a.toLowerCase()===b.toLowerCase(),
  areEqualURLS: (a:string,b:string)=>a===b,
  displayDecimal: (n:number)=>String(n),
  getDateDisplay: () => 'now',
  isNextgenContract: () => false,
  isGradientsContract: () => false,
  isMemeLabContract: () => false,
  isMemesContract: () => true,
  isNullAddress: (a:string)=>a==="0x0",
  numberWithCommas: (n:number)=>String(n),
  getRoyaltyImage: () => 'royal.png',
}));

afterEach(() => jest.clearAllMocks());

describe('printRoyalties', () => {
  it('returns empty fragment when value is zero', () => {
    const { container } = render(<>{printRoyalties(0,1,'0x1')}</>);
    expect(container.firstChild).toBeNull();
  });

  it('renders image with royalty tooltip when applicable', () => {
    const { container } = render(<>{printRoyalties(10,2,'0x1')}</>);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('src','/royal.png');
    expect(img).toHaveAttribute('alt','royal.png');
  });
});

const baseTr = {
    contract: '0xcontract',
    from_address: '0xfrom',
    from_display: 'From',
    to_address: '0xto',
    to_display: 'To',
    token_id: 1,
    token_count: 1,
    value: 0,
    gas: 1,
    gas_gwei: 1,
    gas_price_gwei: 1,
    transaction: 'tx',
    transaction_date: '2020-01-01',
    royalties: 0,
  } as any;

describe('LatestActivityRow', () => {

  it('uses burn icon when to address is null', () => {
    render(<table><tbody><LatestActivityRow tr={{...baseTr, to_address: "0x0"}} /></tbody></table>);
    expect(iconMock).toHaveBeenCalledWith(expect.objectContaining({ icon: faFire, className: 'iconRed' }));
  });

  it('uses mint icon when from address is MANIFOLD and value > 0', () => {
    render(<table><tbody><LatestActivityRow tr={{...baseTr, from_address: MANIFOLD, value: 1}} /></tbody></table>);
    expect(iconMock).toHaveBeenCalledWith(expect.objectContaining({ icon: faCartPlus, className: 'iconWhite' }));
  });

  it('renders gas tooltip', () => {
    render(<>{printGas(1,2,3)}</>);
    expect(iconMock).toHaveBeenCalledWith(expect.objectContaining({ icon: faGasPump }));
  });
});

describe('printGas', () => {
  it('renders gas icon', () => {
    render(<>{printGas(1, 2, 3)}</>);
    expect(iconMock).toHaveBeenCalledWith(expect.objectContaining({ icon: faGasPump }));
  });
});

describe('extra cases', () => {
  it('renders gas tooltip', () => {
    const { container } = render(<>{require('@/components/latest-activity/LatestActivityRow').printGas(1,2,3)}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns empty when token count is zero', () => {
    const { container } = render(<table><tbody><LatestActivityRow tr={{...baseTr, token_count: 0}} /></tbody></table>);
    expect(container.querySelector('tr')).toBeNull();
  });
});

test('printNft fallback when no nft provided', () => {
  const { container } = render(<table><tbody><LatestActivityRow tr={{...baseTr, nft: undefined}} /></tbody></table>);
  expect(container.textContent).toContain('Meme #1');
});
