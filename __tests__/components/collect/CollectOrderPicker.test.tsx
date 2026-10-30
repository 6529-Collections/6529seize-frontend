import { CollectOrderBook } from "@/components/collect/CollectOrderPicker";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const orders: ApiMarketTradeOrder[] = [1, 2].map((number) => ({
  identity: {
    protocol_address: "0x0000000000000068f116a894984e2db1123eb395",
    order_hash: `0x${String(number).repeat(64)}`,
  },
  asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:557",
  maker: `0x${String(number).repeat(40)}`,
  side: ApiMarketTradeOrderSideEnum.Offer,
  quantity: "1",
  currency: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  total_wei: `${number}0000000000000000`,
  net_wei: `${number}0000000000000000`,
  fees: [],
  start_time: "1",
  end_time: "2000000000",
  recipient: "0x0000000000000000000000000000000000000000",
}));

function Picker({
  onChange,
  initialValue = orders[0]!.identity.order_hash,
}: {
  readonly onChange: (order: ApiMarketTradeOrder) => void;
  readonly initialValue?: string | null;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <CollectOrderBook
      loading={false}
      failed={false}
      orders={orders}
      value={value}
      onChange={(order) => {
        setValue(order.identity.order_hash);
        onChange(order);
      }}
    />
  );
}

it("passes the exact order once for row or radio activation and ignores reselection", async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  render(<Picker onChange={onChange} />);
  const [first, second] = screen.getAllByRole("radio");

  await user.click(screen.getByText(`Maker: ${orders[1]!.maker}`));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0]![0]).toBe(orders[1]);
  expect(second).toBeChecked();
  expect(first).not.toBeChecked();

  await user.click(second!);
  await user.click(screen.getByText(`Maker: ${orders[1]!.maker}`));
  expect(onChange).toHaveBeenCalledTimes(1);

  await user.click(first!);
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1]![0]).toBe(orders[0]);
  expect(first).toBeChecked();
});

it("preserves labelled native keyboard selection and the order-hash values", async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  render(<Picker onChange={onChange} />);
  const first = screen.getByRole("radio", {
    name: `0.01 WETH 1 available Maker: ${orders[0]!.maker}`,
  });
  const second = screen.getByRole("radio", {
    name: `0.02 WETH 1 available Maker: ${orders[1]!.maker}`,
  });
  expect(first).toHaveAttribute("value", orders[0]!.identity.order_hash);
  expect(second).toHaveAttribute("value", orders[1]!.identity.order_hash);

  await user.tab();
  expect(first).toHaveFocus();
  await user.keyboard("{ArrowRight}");
  expect(second).toHaveFocus();
  expect(second).toBeChecked();
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0]![0]).toBe(orders[1]);
});

it("keeps separate pickers independent and does not select an order when value is null", async () => {
  const user = userEvent.setup();
  const firstChange = jest.fn();
  const secondChange = jest.fn();
  render(
    <>
      <Picker initialValue={null} onChange={firstChange} />
      <Picker onChange={secondChange} />
    </>
  );
  const [firstGroup, secondGroup] = screen.getAllByRole("group", {
    name: "Choose an order",
  });
  const firstRadios = within(firstGroup!).getAllByRole("radio");
  const secondRadios = within(secondGroup!).getAllByRole("radio");
  firstRadios.forEach((radio) => expect(radio).not.toBeChecked());
  expect(firstRadios[0]!.id).not.toBe(secondRadios[0]!.id);
  expect(firstRadios[0]).not.toHaveAttribute(
    "name",
    secondRadios[0]!.getAttribute("name")
  );
  await user.click(firstRadios[1]!);
  expect(firstRadios[1]).toBeChecked();
  expect(secondRadios[0]).toBeChecked();
  expect(firstChange).toHaveBeenCalledTimes(1);
  expect(secondChange).not.toHaveBeenCalled();
});
