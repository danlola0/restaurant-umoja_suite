import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Invoice, PaymentMethod } from '../../types';
import { formatFC } from '../../utils/formatters';
import { WECHAT_PAY_QR_SRC, ALIPAY_PAY_QR_SRC } from '../../lib/cashierOrders';
import confetti from 'canvas-confetti';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Sparkles,
  Receipt
} from 'lucide-react';

interface PaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  onClose,
  onSuccess,
}) => {
  const { recordPayment } = useRestaurant();

  if (!invoice) return null;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ESPECES');
  const [amountPaid, setAmountPaid] = useState<number>(invoice.remainingAmount);
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cashTendered, setCashTendered] = useState<number>(invoice.remainingAmount);
  const [qrConfirmed, setQrConfirmed] = useState(false);

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'ESPECES', label: 'Cash / 现金', icon: Banknote, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20' },
    { id: 'WECHAT', label: 'WeChat', icon: Smartphone, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20' },
    { id: 'ALIPAY', label: 'Alipay', icon: Smartphone, color: 'text-sky-400 border-sky-500/40 bg-sky-950/20' },
    { id: 'CARTE', label: 'UnionPay / Card', icon: CreditCard, color: 'text-amber-400 border-amber-500/40 bg-amber-950/20' },
  ];

  const quickDenominations = [
    { label: 'Exact', value: invoice.remainingAmount },
    { label: '10 CNY', value: 10 },
    { label: '20 CNY', value: 20 },
    { label: '50 CNY', value: 50 },
    { label: '100 CNY', value: 100 },
    { label: '200 CNY', value: 200 },
  ];

  const changeToReturn = selectedMethod === 'ESPECES' ? Math.max(0, cashTendered - invoice.remainingAmount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountPaid <= 0) return;
    if ((selectedMethod === 'WECHAT' || selectedMethod === 'ALIPAY') && !qrConfirmed) return;

    setIsSubmitting(true);
    try {
      const result = await recordPayment(
        invoice.id,
        amountPaid,
        selectedMethod,
        reference.trim() || undefined,
        note.trim() || undefined
      );

      if (!result.success) return;
      if (result.isFullyPaid) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      onSuccess(invoice.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100">
                Encaissement Facture {invoice.invoiceNumber}
              </h3>
              <p className="text-xs text-stone-400">
                Table <strong className="text-amber-400">{invoice.tableCode}</strong> • Reste dû : <span className="text-stone-200 font-mono">{formatFC(invoice.remainingAmount)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Method Selection */}
          <div>
            <label className="text-xs font-bold text-stone-300 block mb-2">
              Mode de Paiement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentMethods.map(m => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setSelectedMethod(m.id); setQrConfirmed(false); }}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-xs text-left transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold ring-1 ring-amber-500'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Specific Quick Denominations */}
          {selectedMethod === 'ESPECES' && (
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-300">Montant Reçu / Versé par le client</span>
                <span className="font-mono text-stone-400">Total : {formatFC(invoice.remainingAmount)}</span>
              </div>

              {/* Quick buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickDenominations.map(qd => (
                  <button
                    key={qd.label}
                    type="button"
                    onClick={() => {
                      setCashTendered(qd.value);
                      setAmountPaid(Math.min(qd.value, invoice.remainingAmount));
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition ${
                      cashTendered === qd.value
                        ? 'bg-amber-500 text-stone-950 font-black border-amber-400'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-stone-500'
                    }`}
                  >
                    {qd.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Montant perçu (CNY)</label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCashTendered(val);
                      setAmountPaid(Math.min(val, invoice.remainingAmount));
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Monnaie à rendre</label>
                  <div className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-sm font-mono font-bold text-emerald-400">
                    {formatFC(changeToReturn)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(selectedMethod === 'WECHAT' || selectedMethod === 'ALIPAY') && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-center space-y-3">
              <p className="text-xs font-bold text-amber-300">
                {selectedMethod === 'WECHAT' ? 'WeChat Pay' : 'Alipay'} · {formatFC(invoice.remainingAmount)}
              </p>
              <figure className="rounded-lg bg-white p-3 inline-block">
                <img
                  src={selectedMethod === 'WECHAT' ? WECHAT_PAY_QR_SRC : ALIPAY_PAY_QR_SRC}
                  alt={selectedMethod === 'WECHAT' ? 'WeChat' : 'Alipay'}
                  className="mx-auto h-44 w-44 object-contain"
                />
                <figcaption className="mt-1 text-[10px] font-bold text-stone-900">
                  {selectedMethod === 'WECHAT' ? 'WeChat · 阿菲 UMOJA' : 'Alipay'}
                </figcaption>
              </figure>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 text-xs font-bold text-stone-200">
                <input type="checkbox" checked={qrConfirmed} onChange={event => setQrConfirmed(event.target.checked)} className="h-4 w-4 accent-amber-500" />
                Paiement {selectedMethod === 'WECHAT' ? 'WeChat' : 'Alipay'} vérifié
              </label>
            </div>
          )}

          {/* Amount Paid input for partial payments or non-cash */}
          <div>
            <label className="text-xs font-bold text-stone-300 block mb-1">
              Montant à imputer à la facture (CNY)
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              max={invoice.remainingAmount}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-base font-mono font-extrabold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Reference & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-400 block mb-1">
                Réf. Transaction / Reçu (optionnel)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: WeChat / Alipay txn"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 block mb-1">
                Note de caisse (optionnel)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Table VIP, pourboire inclus"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting || amountPaid <= 0 || ((selectedMethod === 'WECHAT' || selectedMethod === 'ALIPAY') && !qrConfirmed)}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {(selectedMethod === 'WECHAT' || selectedMethod === 'ALIPAY') ? `Confirmer ${selectedMethod === 'WECHAT' ? 'WeChat' : 'Alipay'}` : `Valider le règlement de ${formatFC(amountPaid)}`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
