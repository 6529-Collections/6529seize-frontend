import { parseAbi } from "viem";

export const cTokenAbi = parseAbi([
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function exchangeRateStored() view returns (uint256)",
  "function totalBorrows() view returns (uint256)",
  "function totalReserves() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function cash() view returns (uint256)",
  "function reserveFactorMantissa() view returns (uint256)",
  "function supplyRatePerBlock() view returns (uint256)",
  "function borrowRatePerBlock() view returns (uint256)",
  "function underlying() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function borrowBalanceStored(address) view returns (uint256)",
  "event Mint(address indexed minter, uint256 mintAmount, uint256 mintTokens)",
  "event Redeem(address indexed redeemer, uint256 redeemAmount, uint256 redeemTokens)",
  "event Borrow(address indexed borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event RepayBorrow(address indexed payer, address indexed borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event LiquidateBorrow(address indexed liquidator, address indexed borrower, uint256 repayAmount, address indexed cTokenCollateral, uint256 seizeTokens)",
]);

export const comptrollerAbi = parseAbi([
  "function markets(address) view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped)",
  "function getAccountLiquidity(address) view returns (uint256, uint256, uint256)",
  "function compAccrued(address) view returns (uint256)",
  "function oracle() view returns (address)",
]);

export const priceOracleAbi = parseAbi([
  "function getUnderlyingPrice(address) view returns (uint256)",
]);

export const cometAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function baseToken() view returns (address)",
  "function totalsBasic() view returns (uint64 baseSupplyIndex, uint64 baseBorrowIndex, uint64 trackingSupplyIndex, uint64 trackingBorrowIndex, uint128 totalSupplyBase, uint128 totalBorrowBase, uint64 lastAccrualTime)",
  "function getUtilization() view returns (uint256)",
  "function getSupplyRate(uint256 utilization) view returns (uint64)",
  "function getBorrowRate(uint256 utilization) view returns (uint64)",
  "function numAssets() view returns (uint8)",
  "function getAssetInfo(uint8) view returns (uint8 offset, address asset, address priceFeed, uint64 scale, uint64 borrowCollateralFactor, uint64 liquidateCollateralFactor, uint64 liquidationFactor, uint128 supplyCap)",
  "function priceFeed() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function borrowBalanceOf(address) view returns (uint256)",
  "function collateralBalanceOf(address, address) view returns (uint128)",
  "event Supply(address indexed from, address indexed dst, uint256 amount)",
  "event Withdraw(address indexed src, address indexed to, uint256 amount)",
  "event AbsorbCollateral(address indexed absorber, address indexed borrower, address indexed asset, uint256 collateralAbsorbed, uint256 usdValue)",
  "event AbsorbDebt(address indexed absorber, address indexed borrower, uint256 basePaidOut, uint256 usdValue)",
  "event BuyCollateral(address indexed buyer, address indexed asset, uint256 baseAmount, uint256 collateralAmount)",
]);

export const priceFeedAbi = parseAbi([
  "function getPrice(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);
