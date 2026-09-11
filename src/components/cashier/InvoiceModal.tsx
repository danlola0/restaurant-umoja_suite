import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Invoice } from '../../types';
import { invoiceGuestLabel, invoiceLineItems } from '../../lib/cashierOrders';
import { KinMarcheReceipt } from './KinMarcheReceipt';
import { RECEIPT_PRINT_CSS } from '../../utils/printReceipt';
import { X, Printer, Receipt, CreditCard } from 'lucide-react';
import { formatFC } from '../../utils/formatters';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onProceedToPayment?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
  onProceedToPayment,
}) => {
  const { restaurantInfo, orders } = useRestaurant();

  if (!invoice) return null;

  const handlePrint = () => {
    const source = document.getElementById('umoja-print-receipt');
    if (!source) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${invoice.invoiceNumber}</title><style>${RECEIPT_PRINT_CSS}</style></head><body>${source.outerHTML}</body></html>`;
    const printWindow = window.open('', '_blank', 'width=720,height=900');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 200);
  };

  const isPaid = invoice.status === 'PAYEE';
  const items = invoiceLineItems(invoice, orders);
  const guestLabel = invoiceGuestLabel(invoice, orders);

  return (
    <div className="invoice-print-shell fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="invoice-print-panel bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col max-h-[90vh]">
        
        <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-stone-100">
              Reçu · {invoice.invoiceNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="min-h-10 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition text-xs font-bold flex items-center gap-1.5"
              title="Imprimer / réimprimer le reçu"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Réimprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-stone-800/80 print:p-0 print:overflow-visible print:bg-white">
          <KinMarcheReceipt
            invoice={invoice}
            restaurantInfo={restaurantInfo}
            items={items}
            guestLabel={guestLabel}
          />
        </div>

        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
          >
            Fermer
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-amber-300 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimer le ticket
          </button>

          {!isPaid && onProceedToPayment && (
            <button
              onClick={() => {
                onClose();
                onProceedToPayment(invoice);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition shadow flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Enregistrer le Paiement ({formatFC(invoice.remainingAmount)})
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
