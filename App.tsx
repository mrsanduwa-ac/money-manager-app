
import React, { useEffect, useState, useMemo } from 'react';
import { api } from './services/api';
import { Transaction, AccountBalance, MonthlyStats } from './types';
import { ACCOUNTS, LOAN_ACCOUNTS } from './constants';
import BalanceCard from './components/BalanceCard';
import Modal from './components/Modal';
import EditModal from './components/EditModal';
import { IncomeExpenseChart, CategoryPieChart } from './components/Charts';
import { Plus, Minus, Smartphone, Wrench, Wallet, History, Lock, RefreshCw, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Data Fetching ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await api.fetchTransactions();
        // Sort by date desc
        setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  // --- Derived State (Calculations) ---
  const balances = useMemo(() => {
    const accBalances: Record<string, number> = {};
    ACCOUNTS.forEach(a => accBalances[a] = 0);
    LOAN_ACCOUNTS.forEach(a => accBalances[a] = 0);

    transactions.forEach(t => {
      const isLoan = LOAN_ACCOUNTS.includes(t.bank_account);

      if (t.type === 'deposit') {
        if (t.bank_account) {
          if (isLoan) accBalances[t.bank_account] -= t.amount; // Reduce debt
          else accBalances[t.bank_account] += t.amount;
        }
      } 
      else if (t.type === 'withdrawal') {
        if (t.bank_account) accBalances[t.bank_account] -= t.amount;
      }
      else if (t.type === 'reload' && t.is_paid) {
        if (t.bank_account) accBalances[t.bank_account] -= t.amount;
      }
      else if (t.type === 'repair' && t.price_status === 'Added' && t.is_paid) {
        // Repair adds to the bank account selected during closure
        if (t.bank_account) accBalances[t.bank_account] += t.amount;
      }
      else if (t.type === 'loan_acquisition' && isLoan) {
        accBalances[t.bank_account] += t.amount; // Increase debt
      }
    });
    return accBalances;
  }, [transactions]);

  const monthlyStats: MonthlyStats = useMemo(() => {
    const now = new Date();
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
         if (t.type === 'deposit' || (t.type === 'repair' && t.is_paid)) income += t.amount;
         if (t.type === 'withdrawal' || (t.type === 'reload' && t.is_paid)) expense += t.amount;
      }
    });

    return { income, expense, net: income - expense };
  }, [transactions]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    let success = false;
    
    let payload = { ...formData, amount: parseFloat(formData.amount) };

    if (modalType === 'deposit') {
      success = await api.addTransaction({ ...payload, type: 'deposit', is_paid: true });
    } else if (modalType === 'withdraw') {
      success = await api.addTransaction({ ...payload, type: 'withdrawal', is_paid: true });
    } else if (modalType === 'reload') {
       success = await api.addTransaction({ 
         ...payload, 
         type: 'reload', 
         is_paid: formData.is_paid === 'true',
         date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
       });
    } else if (modalType === 'repair') {
      const price = parseFloat(formData.amount);
      success = await api.addTransaction({
        ...payload,
        type: 'repair',
        is_paid: false,
        price_status: price > 0 ? 'Added' : 'Pending',
        original_amount: price
      });
    } else if (modalType === 'loan') {
      // 1. Add Liability
      const loanRes = await api.addTransaction({
        type: 'loan_acquisition',
        amount: parseFloat(formData.amount),
        bank_account: formData.loan_account,
        reason: 'Loan Taken: ' + formData.reason,
        is_paid: true
      });
      // 2. Add Asset (Money in bank)
      if (loanRes) {
        success = await api.addTransaction({
           type: 'deposit',
           amount: parseFloat(formData.amount),
           bank_account: formData.bank_account,
           reason: 'Loan Funds Received',
           is_paid: true
        });
      }
    }

    if (success) {
      setModalType(null);
      setFormData({});
      setRefreshKey(prev => prev + 1); // Trigger Refresh
    } else {
      alert("Transaction Failed. Check connection.");
    }
    setLoading(false);
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>, pin: string) => {
    setLoading(true);
    const success = await api.updateTransaction(id, updates, pin);
    setLoading(false);
    if (success) {
      setRefreshKey(prev => prev + 1); // Trigger Refresh immediately
    }
    return success;
  };

  // --- Rendering Helpers ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Money Manager</h1>
          </div>
          <button onClick={() => setRefreshKey(prev => prev + 1)} className="p-2 text-gray-500 hover:text-blue-600 transition">
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Monthly Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
              <h2 className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlyStats.income)}</h2>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <TrendingUp className="text-emerald-600 w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
             <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Expense</p>
              <h2 className="text-2xl font-bold text-red-600">{formatCurrency(monthlyStats.expense)}</h2>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="text-red-600 w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
             <div>
              <p className="text-sm text-gray-500 mb-1">Net Savings</p>
              <h2 className={`text-2xl font-bold ${monthlyStats.net >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                {formatCurrency(monthlyStats.net)}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Wallet className="text-blue-600 w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ActionButton icon={Plus} label="Deposit" color="bg-emerald-500" onClick={() => setModalType('deposit')} />
          <ActionButton icon={Minus} label="Withdraw" color="bg-red-500" onClick={() => setModalType('withdraw')} />
          <ActionButton icon={Smartphone} label="Reload" color="bg-blue-500" onClick={() => setModalType('reload')} />
          <ActionButton icon={Wrench} label="Repair" color="bg-amber-500" onClick={() => setModalType('repair')} />
          <ActionButton icon={History} label="Loan" color="bg-purple-600" onClick={() => setModalType('loan')} className="col-span-2 md:col-span-1"/>
        </section>

        {/* Balance Cards (Horizontal Scroll) */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="text-lg font-semibold text-gray-800">My Accounts</h2>
             {loading && <span className="text-xs text-blue-500 animate-pulse">Syncing...</span>}
          </div>
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 space-x-0 scrollbar-hide snap-x">
             {ACCOUNTS.map(acc => (
               <div key={acc} className="snap-center">
                 <BalanceCard name={acc} balance={balances[acc] || 0} onClick={() => setSelectedAccount(acc)} />
               </div>
             ))}
          </div>
        </section>
        
        {/* Loan Section */}
        {LOAN_ACCOUNTS.some(acc => balances[acc] > 0) && (
          <section className="bg-red-50 rounded-2xl p-6 border border-red-100">
             <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center">
               <Lock className="w-5 h-5 mr-2" /> Outstanding Loans
             </h2>
             <div className="space-y-3">
               {LOAN_ACCOUNTS.map(acc => balances[acc] > 0 && (
                 <div key={acc} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                    <span className="font-medium text-gray-700">{acc.replace(' Loan', '')}</span>
                    <span className="font-bold text-red-600">{formatCurrency(balances[acc])}</span>
                 </div>
               ))}
             </div>
          </section>
        )}

        {/* Charts & Analytics */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold mb-6">Income vs Expense (This Month)</h3>
             <IncomeExpenseChart transactions={transactions} />
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold mb-6">Expense Breakdown</h3>
             <CategoryPieChart transactions={transactions} />
           </div>
        </section>

        {/* Recent Transactions List */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
             {selectedAccount && (
               <button onClick={() => setSelectedAccount(null)} className="text-sm text-blue-600 hover:underline">
                 Clear Filter ({selectedAccount})
               </button>
             )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Account</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions
                  .filter(t => !selectedAccount || t.bank_account === selectedAccount)
                  .slice(0, 20) // Limit to 20 for performance
                  .map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">
                        {t.type === 'reload' ? `Reload: ${t.customer_name}` : 
                         t.type === 'repair' ? `Repair: ${t.customer_name} (${t.phone_name})` : 
                         t.reason}
                      </div>
                      {t.type === 'repair' && <div className="text-xs text-gray-400">{t.fault}</div>}
                    </td>
                    <td className="p-4 text-gray-500">{t.bank_account || '-'}</td>
                    <td className={`p-4 text-right font-bold ${
                      ['deposit', 'loan_acquisition'].includes(t.type) || (t.type === 'repair' && t.is_paid) 
                      ? 'text-emerald-600' : 'text-gray-800'
                    }`}>
                      {['withdrawal', 'reload'].includes(t.type) ? '-' : '+'} {formatCurrency(t.amount)}
                    </td>
                    <td className="p-4 text-center">
                       {t.is_paid ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                           Paid
                         </span>
                       ) : (
                         <button 
                           onClick={() => openEditModal(t)}
                           className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors shadow-sm"
                         >
                           {t.type === 'repair' ? 'Update Price' : 'Mark Paid'}
                           <Edit2 className="w-3 h-3 ml-1" />
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* --- Modals --- */}
      
      {/* Edit & Pay Modal */}
      <EditModal 
        transaction={editingTransaction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateTransaction}
        loading={loading}
      />

      {/* Deposit Modal */}
      <Modal isOpen={modalType === 'deposit'} onClose={() => setModalType(null)} title="Make a Deposit">
         <div className="space-y-4">
           <Input name="amount" label="Amount (LKR)" type="number" onChange={handleInputChange} />
           <Input name="reason" label="Reason" onChange={handleInputChange} />
           <Select name="bank_account" label="Account" options={ACCOUNTS} onChange={handleInputChange} />
           <SubmitBtn onClick={handleSubmit} loading={loading} />
         </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={modalType === 'withdraw'} onClose={() => setModalType(null)} title="Withdraw Cash">
         <div className="space-y-4">
           <Input name="amount" label="Amount (LKR)" type="number" onChange={handleInputChange} />
           <Input name="reason" label="Reason" onChange={handleInputChange} />
           <Select name="bank_account" label="From Account" options={ACCOUNTS} onChange={handleInputChange} />
           <SubmitBtn onClick={handleSubmit} loading={loading} color="bg-red-600 hover:bg-red-700" />
         </div>
      </Modal>

      {/* Reload Modal */}
      <Modal isOpen={modalType === 'reload'} onClose={() => setModalType(null)} title="Reload / Bill Payment">
         <div className="space-y-4">
           <Input name="customer_name" label="Customer Name" onChange={handleInputChange} />
           <Input name="amount" label="Amount (LKR)" type="number" onChange={handleInputChange} />
           <Input name="date" label="Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} onChange={handleInputChange} />
           <Select name="bank_account" label="Deduct From" options={ACCOUNTS} onChange={handleInputChange} />
           <div className="flex items-center mt-2">
              <input type="checkbox" name="is_paid" value="true" onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
              <label className="ml-2 block text-sm text-gray-900">Mark as Paid Immediately?</label>
           </div>
           <SubmitBtn onClick={handleSubmit} loading={loading} color="bg-blue-600 hover:bg-blue-700" />
         </div>
      </Modal>

      {/* Repair Modal */}
      <Modal isOpen={modalType === 'repair'} onClose={() => setModalType(null)} title="New Repair Job">
         <div className="space-y-4">
           <Input name="customer_name" label="Customer Name" onChange={handleInputChange} />
           <Input name="phone_name" label="Device Model" onChange={handleInputChange} />
           <Input name="fault" label="Fault / Issue" onChange={handleInputChange} />
           <Input name="amount" label="Estimated Price (0 for Pending)" type="number" onChange={handleInputChange} />
           <Select name="bank_account" label="Recieve Payment To" options={['', ...ACCOUNTS]} onChange={handleInputChange} />
           <SubmitBtn onClick={handleSubmit} loading={loading} color="bg-amber-600 hover:bg-amber-700" />
         </div>
      </Modal>

      {/* Loan Modal */}
      <Modal isOpen={modalType === 'loan'} onClose={() => setModalType(null)} title="Add New Loan">
         <div className="space-y-4">
           <Select name="loan_account" label="Loan Provider" options={LOAN_ACCOUNTS} onChange={handleInputChange} />
           <Input name="amount" label="Loan Amount" type="number" onChange={handleInputChange} />
           <Select name="bank_account" label="Deposit Funds To" options={ACCOUNTS} onChange={handleInputChange} />
           <Input name="reason" label="Purpose" onChange={handleInputChange} />
           <SubmitBtn onClick={handleSubmit} loading={loading} color="bg-purple-600 hover:bg-purple-700" />
         </div>
      </Modal>

    </div>
  );
}

// --- Subcomponents ---

const ActionButton = ({ icon: Icon, label, color, onClick, className = '' }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-md text-white transition-transform active:scale-95 hover:shadow-lg ${color} ${className}`}
  >
    <Icon className="w-6 h-6 mb-2" />
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

const Input = ({ label, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm border" {...props} />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm border" {...props}>
      <option value="">Select Option</option>
      {options.map((o: string) => <option key={o} value={o}>{o.replace(' Loan', '')}</option>)}
    </select>
  </div>
);

const SubmitBtn = ({ onClick, loading, color = 'bg-emerald-600 hover:bg-emerald-700' }: any) => (
  <button 
    disabled={loading}
    onClick={onClick}
    className={`w-full text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition-all ${color} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
  >
    {loading ? 'Processing...' : 'Save Transaction'}
  </button>
);

export default App;
