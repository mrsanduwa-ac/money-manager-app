import React from 'react';
import { ACCOUNT_COLORS } from '../constants';
import { CreditCard, Wallet, Landmark } from 'lucide-react';

interface Props {
  name: string;
  balance: number;
  onClick: () => void;
}

const BalanceCard: React.FC<Props> = ({ name, balance, onClick }) => {
  const bgClass = ACCOUNT_COLORS[name] || 'from-gray-500 to-gray-600';
  
  let Icon = Landmark;
  if (name === 'Wallet') Icon = Wallet;
  if (name === 'Solo') Icon = CreditCard;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(balance);

  return (
    <div 
      onClick={onClick}
      className={`relative flex-shrink-0 w-80 h-48 rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br ${bgClass} cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl mr-6 overflow-hidden`}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Current Balance</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{formattedBalance}</h3>
        </div>
        <Icon className="w-8 h-8 opacity-80" />
      </div>

      <div className="absolute bottom-6 left-6 z-10">
        <p className="text-sm font-medium opacity-70">Account Name</p>
        <p className="text-lg font-semibold tracking-wide">{name}</p>
      </div>

      <div className="absolute bottom-6 right-6 z-10">
        <img src="https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/chip.png" alt="chip" className="w-10 h-8 opacity-80 rounded" />
      </div>
    </div>
  );
};

export default BalanceCard;
