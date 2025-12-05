// !!! REPLACE WITH YOUR GOOGLE APPS SCRIPT URL !!!
export const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbylu6VnMOFJSOt7JGGUnDTQxUXBP2Oc55eUy_9KAQouMX6LlVo4xddbphAEjBsDorOwog/exec';

export const USER_ID = 'money_manager_user';
export const SECURE_PIN = "1234";

export const ACCOUNTS = [
  'Sampath Bank', 
  'Commercial Bank', 
  'HNB Bank', 
  'Peoples Bank', 
  'Dialog Finance', 
  'Solo', 
  'Wallet'
];

export const LOAN_ACCOUNTS = [
  'Peoples Bank Loan', 
  'Dialog Finance Loan'
];

export const ACCOUNT_COLORS: Record<string, string> = {
  'Sampath Bank': 'from-orange-500 to-orange-600',
  'Commercial Bank': 'from-blue-500 to-blue-600',
  'HNB Bank': 'from-yellow-500 to-yellow-600',
  'Peoples Bank': 'from-red-500 to-red-600',
  'Dialog Finance': 'from-red-700 to-red-800',
  'Solo': 'from-purple-500 to-purple-600',
  'Wallet': 'from-slate-700 to-slate-800',
  'Peoples Bank Loan': 'from-red-900 to-red-950',
  'Dialog Finance Loan': 'from-red-900 to-red-950',
};
