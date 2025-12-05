import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

export const IncomeExpenseChart: React.FC<Props> = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTxns = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  let income = 0;
  let expense = 0;

  monthlyTxns.forEach(t => {
    if (t.type === 'deposit' || (t.type === 'repair' && t.is_paid)) income += t.amount;
    if (t.type === 'withdrawal' || (t.type === 'reload' && t.is_paid)) expense += t.amount;
  });

  const data = [
    { name: 'Income', amount: income },
    { name: 'Expense', amount: expense }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="amount" fill="#8884d8" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.name === 'Income' ? '#10B981' : '#EF4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<Props> = ({ transactions }) => {
  // Aggregate by type
  const dataMap: Record<string, number> = {};
  
  transactions.forEach(t => {
    if (t.type === 'withdrawal' || t.type === 'reload') {
      const key = t.type === 'reload' ? 'Reload' : (t.reason ? t.reason.split(' ')[0] : 'Other');
      dataMap[key] = (dataMap[key] || 0) + t.amount;
    }
  });

  const data = Object.keys(dataMap).map(key => ({ name: key, value: dataMap[key] }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
