import { GAS_API_URL, USER_ID } from '../constants';
import { Transaction } from '../types';

export const api = {
  fetchTransactions: async (): Promise<Transaction[]> => {
    try {
      if (GAS_API_URL.includes('YOUR_GAS')) throw new Error("Please configure GAS URL in constants.ts");
      
      const response = await fetch(`${GAS_API_URL}?action=fetchData&userId=${USER_ID}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      return data;
    } catch (error) {
      console.error("Fetch Error:", error);
      throw error;
    }
  },

  addTransaction: async (data: Partial<Transaction>): Promise<boolean> => {
    const payload = {
      action: 'addTransaction',
      userId: USER_ID,
      data: { ...data, id: crypto.randomUUID(), date: new Date().toISOString() }
    };

    return sendPostRequest(payload);
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>, pin: string): Promise<boolean> => {
    const payload = {
      action: 'updateStatus',
      userId: USER_ID,
      transactionId: id,
      updates,
      pin
    };
    return sendPostRequest(payload);
  }
};

async function sendPostRequest(payload: any): Promise<boolean> {
  try {
    // We use no-cors if simple POST fails, but standard fetch is preferred for JSON response
    // GAS Web Apps often require 'application/x-www-form-urlencoded' or handle text/plain
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Post Error:", error);
    return false;
  }
}
