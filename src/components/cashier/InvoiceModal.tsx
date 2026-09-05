import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Invoice } from '../../types';
import { formatFC, formatDateTime } from '../../utils/formatters';
import { 
  X, 
  Printer, 
  Download, 
  Receipt, 
  CheckCircle2, 
  CreditCard, 
  Building, 
  Phone, 
  MapPin,
  Utensils
} from 'lucide-react';

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
  const { restaurantInfo } = useRestaurant();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.status === 'PAYEE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-stone-100">
              Facture {invoice.invoiceNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition text-xs flex items-center gap-1"
              title="Imprimer le ticket"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-950/60 font-mono text-xs text-stone-300 space-y-4 printable-receipt">
          
          {/* Restaurant Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-700">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-lg font-black text-stone-950">U</div>
            <h2 className="text-base font-black text-amber-400 tracking-wider uppercase">
              {restaurantInfo.name}
            </h2>
            <p className="text-[10px] text-stone-400">{restaurantInfo.slogan}</p>
            <p className="text-[10px] text-stone-400">{restaurantInfo.address}</p>
            <p className="text-[10px] text-stone-400">Tél : {restaurantInfo.phone}</p>
            <p className="text-[9px] text-stone-500">{restaurantInfo.nifRccm}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-dashed border-stone-700">
            <div>
              <span className="text-stone-500 block">Facture N°:</span>
              <strong className="text-stone-200">{invoice.invoiceNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block">Date & Heure :</span>
              <span className="text-stone-200">{formatDateTime(invoice.createdAt)}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Table :</span>
              <strong className="text-amber-400 text-sm">{invoice.tableCode}</strong>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block">Caissier(ère) :</span>
              <span className="text-stone-200">{invoice.cashierName}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 pb-3 border-b border-dashed border-stone-700">
            <div className="flex justify-between font-bold text-stone-400 text-[10px] uppercase border-b border-stone-800 pb-1">
              <span className="flex-1">Désignation</span>
              <span className="w-10 text-center">Qté</span>
              <span className="w-20 text-right">P.U</span>
              <span className="w-24 text-right">Total</span>
            </div>

            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between py-1 text-[11px]">
                <span className="flex-1 text-stone-200 font-sans font-medium line-clamp-1">
                  {item.productName}
                </span>
                <span className="w-10 text-center font-bold text-stone-300">
                  {item.quantity}
                </span>
                <span className="w-20 text-right text-stone-400">
                  {formatFC(item.unitPrice)}
                </span>
                <span className="w-24 text-right font-bold text-stone-100">
                  {formatFC(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals & Discounts */}
          <div className="space-y-1.5 text-xs pb-3 border-b border-dashed border-stone-700">
            <div className="flex justify-between text-stone-400">
              <span>Sous-total HT :</span>
              <span>{formatFC(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Remise commerciale :</span>
                <span>- {formatFC(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-400">
              <span>TVA (Incluse) :</span>
              <span>¥0 CNY</span>
            </div>
            <div className="flex justify-between text-sm font-black text-stone-100 pt-2 border-t border-stone-800">
              <span className="uppercase tracking-wider">TOTAL À PAYER :</span>
              <span className="text-amber-400 text-base">{formatFC(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Status Stamp */}
          <div className="text-center pt-2 space-y-1">
            {isPaid ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-xl text-emerald-300 space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-sm font-extrabold uppercase tracking-widest text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  FACTURE PAYÉE & SOLDÉE
                </div>
                <div className="text-[10px] text-emerald-400/80">
                  Réglée via {invoice.paymentMethod || 'ESPECES'} • Réf: {invoice.paymentReference || 'OK'}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-950/30 border border-amber-600/50 rounded-xl text-amber-300">
                <div className="font-bold text-xs uppercase tracking-wider">
                  EN ATTENTE DE RÈGLEMENT
                </div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">
                  Reste dû : {formatFC(invoice.remainingAmount)}
                </div>
              </div>
            )}

            <p className="text-[10px] text-stone-500 pt-2">
              Merci de votre visite au Restaurant Umoja ! Bon retour et à très bientôt.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
          >
            Fermer
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
