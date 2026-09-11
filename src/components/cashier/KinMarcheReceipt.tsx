import React from 'react';
import { Invoice, RestaurantInfo } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { paymentMethodLabel } from '../../lib/cashierOrders';

interface KinMarcheReceiptProps {
  invoice: Invoice;
  restaurantInfo: RestaurantInfo;
  items: Invoice['items'];
  guestLabel: string;
}

const yen = (amount: number) => `¥${Math.round(Number(amount) || 0)}`;

export const KinMarcheReceipt: React.FC<KinMarcheReceiptProps> = ({
  invoice,
  restaurantInfo,
  items,
  guestLabel,
}) => {
  const isPaid = invoice.status === 'PAYEE';
  const initials = (restaurantInfo.name || 'UMOJA').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();

  return (
    <article
      id="umoja-print-receipt"
      className="kin-marche-receipt"
      style={{
        width: '100%',
        maxWidth: '148mm',
        margin: '0 auto',
        background: '#fff',
        color: '#111',
        fontFamily: 'Arial, "Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: '12px',
        lineHeight: 1.35,
        padding: '6mm',
        boxSizing: 'border-box',
      }}
    >
      <header style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '2px solid #111', paddingBottom: '8px' }}>
        <div style={{ width: '42px', height: '42px', border: '2px solid #111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
          {initials || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px' }}>{restaurantInfo.name || 'UMOJA MALEWA RESTAURANT'}</div>
          {restaurantInfo.slogan ? <div style={{ fontSize: '11px' }}>{restaurantInfo.slogan}</div> : null}
          <div style={{ fontSize: '11px' }}>{restaurantInfo.address || '广州市越秀区下塘西路87号101房'}</div>
          <div style={{ fontSize: '11px' }}>TEL: {restaurantInfo.phone || '17701958709'}</div>
        </div>
      </header>

      <h1 style={{ textAlign: 'center', fontSize: '15px', margin: '10px 0 8px' }}>FACTURE / 发票</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '2px 0' }}>N° facture</td>
            <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700 }}>{invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style={{ padding: '2px 0' }}>Date et heure</td>
            <td style={{ padding: '2px 0', textAlign: 'right' }}>{formatDateTime(invoice.paidAt || invoice.createdAt)}</td>
          </tr>
          <tr>
            <td style={{ padding: '2px 0' }}>Table</td>
            <td style={{ padding: '2px 0', textAlign: 'right' }}>{invoice.tableCode || guestLabel}</td>
          </tr>
          <tr>
            <td style={{ padding: '2px 0' }}>Client</td>
            <td style={{ padding: '2px 0', textAlign: 'right' }}>{guestLabel || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '2px 0' }}>Caissier</td>
            <td style={{ padding: '2px 0', textAlign: 'right' }}>{invoice.cashierName || 'UMOJA'}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #111', textAlign: 'left', padding: '4px 2px' }}>Désignation</th>
            <th style={{ borderBottom: '1px solid #111', textAlign: 'right', padding: '4px 2px', width: '36px' }}>Qté</th>
            <th style={{ borderBottom: '1px solid #111', textAlign: 'right', padding: '4px 2px', width: '58px' }}>P.U.</th>
            <th style={{ borderBottom: '1px solid #111', textAlign: 'right', padding: '4px 2px', width: '62px' }}>Sous-total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.productName}-${index}`}>
              <td style={{ padding: '5px 2px', textTransform: 'uppercase' }}>{item.productName}</td>
              <td style={{ padding: '5px 2px', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '5px 2px', textAlign: 'right' }}>{yen(item.unitPrice)}</td>
              <td style={{ padding: '5px 2px', textAlign: 'right' }}>{yen(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '8px', borderTop: '1px solid #111' }}>
        <tbody>
          {invoice.discountAmount > 0 && (
            <tr>
              <td style={{ padding: '4px 2px' }}>Remise</td>
              <td style={{ padding: '4px 2px', textAlign: 'right' }}>-{yen(invoice.discountAmount)}</td>
            </tr>
          )}
          <tr>
            <td style={{ padding: '6px 2px', fontWeight: 800, fontSize: '14px' }}>TOTAL</td>
            <td style={{ padding: '6px 2px', textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>{yen(invoice.totalAmount)}</td>
          </tr>
          <tr>
            <td style={{ padding: '3px 2px' }}>Mode de paiement</td>
            <td style={{ padding: '3px 2px', textAlign: 'right' }}>{paymentMethodLabel(invoice.paymentMethod)}</td>
          </tr>
          <tr>
            <td style={{ padding: '3px 2px' }}>Statut du paiement</td>
            <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight: 800 }}>{isPaid ? 'PAYÉE / PAID' : 'NON PAYÉE / UNPAID'}</td>
          </tr>
          {invoice.paymentReference ? (
            <tr>
              <td style={{ padding: '3px 2px' }}>Référence</td>
              <td style={{ padding: '3px 2px', textAlign: 'right' }}>{invoice.paymentReference}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', fontWeight: 700 }}>Thank you  谢谢光临</p>
    </article>
  );
};
