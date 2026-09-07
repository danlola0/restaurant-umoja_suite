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

const line = '--------------------------------';

export const KinMarcheReceipt: React.FC<KinMarcheReceiptProps> = ({
  invoice,
  restaurantInfo,
  items,
  guestLabel,
}) => {
  const isPaid = invoice.status === 'PAYEE';

  return (
    <article
      id="umoja-print-receipt"
      className="kin-marche-receipt"
      style={{
        width: '72mm',
        maxWidth: '72mm',
        margin: '0 auto',
        background: '#fff',
        color: '#000',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '12px',
        lineHeight: 1.35,
        padding: '8px 6px 12px',
        boxSizing: 'border-box',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.04em' }}>
          {restaurantInfo.name || 'UMOJA MALEWA RESTAURANT'}
        </div>
        <div>TEL: {restaurantInfo.phone || '17701958709'}</div>
        <div style={{ fontSize: '10px' }}>广州市越秀区下塘西路87号101房</div>
        <div style={{ fontSize: '10px' }}>Rm 101, No.87 Xiatangxi Rd, Yuexiu</div>
        <div style={{ marginTop: '6px' }}>{line}</div>
        <div>** SALES RECEIPT **</div>
        <div>{line}</div>
      </header>

      <section>
        <div>No.: {invoice.invoiceNumber}</div>
        <div>Date: {formatDateTime(invoice.paidAt || invoice.createdAt)}</div>
        <div>Table: {guestLabel}</div>
        <div>Cashier: {invoice.cashierName || 'UMOJA'}</div>
        <div>{line}</div>
      </section>

      <section>
        <div style={{ display: 'flex', fontWeight: 700 }}>
          <span style={{ flex: 1 }}>ITEM</span>
          <span style={{ width: '28px', textAlign: 'right' }}>QTY</span>
          <span style={{ width: '58px', textAlign: 'right' }}>AMT</span>
        </div>
        {items.map((item, index) => (
          <div key={`${item.productName}-${index}`} style={{ marginTop: '4px' }}>
            <div style={{ textTransform: 'uppercase' }}>{item.productName}</div>
            <div style={{ display: 'flex' }}>
              <span style={{ flex: 1 }}>{item.quantity} x {formatFC(item.unitPrice)}</span>
              <span style={{ width: '58px', textAlign: 'right' }}>{formatFC(item.subtotal)}</span>
            </div>
          </div>
        ))}
        <div>{line}</div>
      </section>

      <section>
        {invoice.discountAmount > 0 && (
          <div style={{ display: 'flex' }}>
            <span style={{ flex: 1 }}>DISCOUNT</span>
            <span>-{formatFC(invoice.discountAmount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', fontWeight: 700, fontSize: '14px' }}>
          <span style={{ flex: 1 }}>TOTAL</span>
          <span>{formatFC(invoice.totalAmount)}</span>
        </div>
        <div style={{ display: 'flex' }}>
          <span style={{ flex: 1 }}>PAY</span>
          <span>{paymentMethodLabel(invoice.paymentMethod)}</span>
        </div>
        {invoice.paymentReference && (
          <div style={{ display: 'flex' }}>
            <span style={{ flex: 1 }}>REF</span>
            <span>{invoice.paymentReference}</span>
          </div>
        )}
        <div style={{ textAlign: 'center', fontWeight: 700, marginTop: '6px' }}>
          {isPaid ? '*** PAID ***' : '*** UNPAID ***'}
        </div>
        <div>{line}</div>
      </section>

      <section style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>SCAN TO PAY  扫码付款</div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          <div style={{ flex: 1 }}>
            <img src={WECHAT_PAY_QR_SRC} alt="WeChat" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>WeChat</div>
          </div>
          <div style={{ flex: 1 }}>
            <img src={ALIPAY_PAY_QR_SRC} alt="Alipay" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>Alipay</div>
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>Thank you  谢谢光临</div>
        <div>Please keep this receipt</div>
        <div style={{ marginTop: '8px' }}>{line}</div>
      </section>
    </article>
  );
};
