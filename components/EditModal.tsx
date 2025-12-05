
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Transaction } from '../types';
import { ACCOUNTS } from '../constants';

interface Props {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Transaction>, pin: string) => Promise<boolean>;
  loading: boolean;
}

const EditModal: React.FC<Props> = ({ transaction, isOpen, onClose, onUpdate, loading }) => {
  const [pin, setPin] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setAccount(transaction.bank_account || '');
      setPin('');
      setError('');
    }
  }, [transaction]);

  const handleSubmit = async () => {
    if (!transaction) return;
    if (!pin) {
      setError('PIN is required');
      return;
    }

    const updates: Partial<Transaction> = {
      is_paid: true,
    };

    // If it's a repair, we might be updating the price and setting the account
    if (transaction.type === 'repair') {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (!account) {
        setError('Please select a bank account');
        return;
      }
      updates.amount = numAmount;
      updates.original_amount = numAmount;
      updates.bank_account = account;
      updates.price_status = 'Added';
    }

    const success = await onUpdate(transaction.id, updates, pin);
    if (!success) {
      setError('Update failed. Check PIN or connection.');
    } else {
      onClose();
    }
  };

  if (!transaction) return null;

  const isRepair = transaction.type === 'repair';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isRepair ? "Complete Repair Job" : "Mark as Paid"}>
      <div className="space-y-4">
        
        {isRepair && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Repair Price (LKR)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Received To</label>
              <select 
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Account</option>
                {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </>
        )}

        {!isRepair && (
          <p className="text-gray-600 text-sm">
            Are you sure you want to mark this <strong>{transaction.type}</strong> of <strong>LKR {transaction.amount}</strong> as paid?
          </p>
        )}

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Enter Security PIN</label>
          <input 
            type="password" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            className="block w-full rounded-lg border-gray-300 bg-white p-2.5 border focus:ring-red-500 focus:border-red-500 tracking-widest text-center text-lg"
          />
          {error && <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>}
        </div>

        <button 
          disabled={loading}
          onClick={handleSubmit}
          className={`w-full text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {loading ? 'Verifying...' : 'Confirm Update'}
        </button>
      </div>
    </Modal>
  );
};

export default EditModal;
