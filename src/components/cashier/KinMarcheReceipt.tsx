import React from 'react';
import { Invoice, RestaurantInfo } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { WECHAT_PAY_QR_SRC, ALIPAY_PAY_QR_SRC, paymentMethodLabel } from '../../lib/cashierOrders';

interface KinMarcheReceiptProps {
  invoice: Invoice;
  restaurantInfo: RestaurantInfo;
  items: Invoice['items'];
  guestLabel: string;
  wechatQrSrc?: string;
  alipayQrSrc?: string;
}

const yen = (amount: number) => `¥${Math.round(Number(amount) || 0)}`;

export const KinMarcheReceipt: React.FC<KinMarcheReceiptProps> = ({
  invoice,
  restaurantInfo,
  items,
  guestLabel,
  wechatQrSrc = WECHAT_PAY_QR_SRC,
  alipayQrSrc = ALIPAY_PAY_QR_SRC,
}) => {
  const isPaid = invoice.status === 'PAYEE';
  const cell: React.CSSProperties = { padding: '1px 0', verticalAlign: 'top' };

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
        fontFamily: 'Arial, "Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: '13px',
        lineHeight: 1.25,
        padding: '4px 2px 8px',
        boxSizing: 'border-box',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '15px' }}>
          {restaurantInfo.name || 'UMOJA MALEWA RESTAURANT'}
        </div>
        <div style={{ fontSize: '12px' }}>TEL: {restaurantInfo.phone || '17701958709'}</div>
        <div style={{ fontSize: '11px' }}>广州市越秀区下塘西路87号101房</div>
        <div style={{ fontSize: '11px' }}>Rm 101, No.87 Xiatangxi Rd, Yuexiu</div>
        <div style={{ margin: '6px 0 4px', fontWeight: 800 }}>** SALES RECEIPT **</div>
      </header>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <tbody>
          <tr><td style={cell}>No.</td><td style={{ ...cell, textAlign: 'right' }}>{invoice.invoiceNumber}</td></tr>
          <tr><td style={cell}>Date</td><td style={{ ...cell, textAlign: 'right' }}>{formatDateTime(invoice.paidAt || invoice.createdAt)}</td></tr>
          <tr><td style={cell}>Table</td><td style={{ ...cell, textAlign: 'right' }}>{guestLabel}</td></tr>
          <tr><td style={cell}>Cashier</td><td style={{ ...cell, textAlign: 'right' }}>{invoice.cashierName || 'UMOJA'}</td></tr>
        </tbody>
      </table>

      <div style={{ borderTop: '1px solid #000', margin: '6px 0 4px' }} />

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ ...cell, textAlign: 'left', fontWeight: 800 }}>ITEM</th>
            <th style={{ ...cell, width: '28px', textAlign: 'right', fontWeight: 800 }}>QTY</th>
            <th style={{ ...cell, width: '52px', textAlign: 'right', fontWeight: 800 }}>AMT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.productName}-${index}`}>
              <td style={{ ...cell, paddingTop: '4px', textTransform: 'uppercase' }}>{item.productName}</td>
              <td style={{ ...cell, paddingTop: '4px', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ ...cell, paddingTop: '4px', textAlign: 'right' }}>{yen(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px solid #000', margin: '6px 0 4px' }} />

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <tbody>
          {invoice.discountAmount > 0 && (
            <tr>
              <td style={cell}>DISCOUNT</td>
              <td style={{ ...cell, textAlign: 'right' }}>-{yen(invoice.discountAmount)}</td>
            </tr>
          )}
          <tr>
            <td style={{ ...cell, fontWeight: 800, fontSize: '15px' }}>TOTAL</td>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 800, fontSize: '15px' }}>{yen(invoice.totalAmount)}</td>
          </tr>
          <tr>
            <td style={cell}>PAY</td>
            <td style={{ ...cell, textAlign: 'right' }}>{paymentMethodLabel(invoice.paymentMethod)}</td>
          </tr>
          {invoice.paymentReference ? (
            <tr>
              <td style={cell}>REF</td>
              <td style={{ ...cell, textAlign: 'right' }}>{invoice.paymentReference}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div style={{ textAlign: 'center', fontWeight: 800, margin: '8px 0 6px' }}>
        {isPaid ? '*** PAID ***' : '*** UNPAID ***'}
      </div>

      <div style={{ borderTop: '1px solid #000', marginBottom: '6px' }} />

      <section style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '12px' }}>SCAN TO PAY  扫码付款</div>
        <table style={{ width: '100%', marginTop: '6px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                <img className="umoja-qr" src={wechatQrSrc} alt="WeChat" style={{ width: '28mm', height: '28mm', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '3px' }}>WeChat</div>
              </td>
              <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                <img className="umoja-qr" src={alipayQrSrc} alt="Alipay" style={{ width: '28mm', height: '28mm', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '3px' }}>Alipay</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '8px', fontSize: '12px' }}>Thank you  谢谢光临</div>
        <div style={{ fontSize: '11px' }}>Please keep this receipt</div>
      </section>
    </article>
  );
};
