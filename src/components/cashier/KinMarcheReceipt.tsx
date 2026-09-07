import React from 'react';
import { Invoice, RestaurantInfo } from '../../types';
import { formatDateTime, formatFC } from '../../utils/formatters';
import { WECHAT_PAY_QR_SRC, ALIPAY_PAY_QR_SRC, paymentMethodLabel } from '../../lib/cashierOrders';

interface KinMarcheReceiptProps {
  invoice: Invoice;
  restaurantInfo: RestaurantInfo;
  items: Invoice['items'];
  guestLabel: string;
}

export const KinMarcheReceipt: React.FC<KinMarcheReceiptProps> = ({
  invoice,
  restaurantInfo,
  items,
  guestLabel,
}) => {
  const isPaid = invoice.status === 'PAYEE';

  return (
    <article id="umoja-print-receipt" className="kin-marche-receipt mx-auto w-full max-w-[320px] bg-white text-black px-4 py-5 font-mono text-[11px] leading-snug shadow-xl">
      <header className="text-center border-b border-dashed border-black pb-3 space-y-1">
        <p className="text-[9px] tracking-[0.28em] uppercase text-neutral-600">Official receipt</p>
        <h2 className="text-[15px] font-black tracking-wide leading-tight">
          {restaurantInfo.name || 'UMOJA MALEWA RESTAURANT'}
        </h2>
        <p className="text-[10px] font-semibold">Delivery / Livraison · CALL US</p>
        <p className="text-[11px] font-bold">{restaurantInfo.phone || '17701958709'}</p>
        <p className="text-[10px] pt-1">地址：广州市越秀区下塘西路87号101房</p>
        <p className="text-[9px] leading-relaxed">
          Room 101, 1st Floor, No. 87 Xiatangxi Road,<br />
          Yuexiu District, Guangzhou
        </p>
      </header>

      <section className="py-3 border-b border-dashed border-black space-y-1">
        <div className="flex justify-between gap-2">
          <span>Invoice No.</span>
          <strong>{invoice.invoiceNumber}</strong>
        </div>
        <div className="flex justify-between gap-2">
          <span>Date / Time</span>
          <span>{formatDateTime(invoice.paidAt || invoice.createdAt)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Table / Guest</span>
          <strong>{guestLabel}</strong>
        </div>
        <div className="flex justify-between gap-2">
          <span>Cashier</span>
          <span>{invoice.cashierName || 'UMOJA'}</span>
        </div>
      </section>

      <section className="py-3 border-b border-dashed border-black">
        <div className="flex font-bold uppercase text-[10px] pb-1">
          <span className="flex-1">Item</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-16 text-right">Price</span>
          <span className="w-16 text-right">Amount</span>
        </div>
        {items.length === 0 ? (
          <p className="py-2 text-center text-[10px]">—</p>
        ) : items.map((item, index) => (
          <div key={`${item.productName}-${index}`} className="flex py-0.5">
            <span className="flex-1 pr-1 uppercase">{item.productName}</span>
            <span className="w-8 text-center">{item.quantity}</span>
            <span className="w-16 text-right">{formatFC(item.unitPrice)}</span>
            <span className="w-16 text-right font-bold">{formatFC(item.subtotal)}</span>
          </div>
        ))}
      </section>

      <section className="py-3 border-b border-dashed border-black space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatFC(invoice.subtotal || invoice.totalAmount)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>- {formatFC(invoice.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-black pt-2">
          <span>TOTAL</span>
          <span>{formatFC(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between pt-1">
          <span>Payment</span>
          <strong>{paymentMethodLabel(invoice.paymentMethod)}</strong>
        </div>
        {invoice.paymentReference && (
          <div className="flex justify-between">
            <span>Reference</span>
            <span>{invoice.paymentReference}</span>
          </div>
        )}
        <div className="text-center font-black tracking-[0.18em] pt-2">
          {isPaid ? 'PAID' : 'UNPAID'}
        </div>
      </section>

      <section className="pt-4 text-center space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide">Scan to pay · 扫码付款</p>
        <div className="grid grid-cols-2 gap-2">
          <figure className="border border-black bg-white p-1">
            <img src={WECHAT_PAY_QR_SRC} alt="WeChat Pay 阿菲 UMOJA" className="w-full h-auto object-contain" />
            <figcaption className="text-[9px] font-bold mt-1">WeChat · 阿菲 UMOJA</figcaption>
          </figure>
          <figure className="border border-black bg-white p-1">
            <img src={ALIPAY_PAY_QR_SRC} alt="Alipay QR" className="w-full h-auto object-contain" />
            <figcaption className="text-[9px] font-bold mt-1">Alipay</figcaption>
          </figure>
        </div>
        <p className="text-[9px] pt-1">Thank you · 谢谢光临</p>
      </section>
    </article>
  );
};
