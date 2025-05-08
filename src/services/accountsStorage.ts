
export interface GeneratedAccount {
  id: string;
  address: string;
  password: string;
  createdAt: string;
}

const ACCOUNTS_STORAGE_KEY = "generated_accounts";

export const accountsStorage = {
  getAccounts(): GeneratedAccount[] {
    const accounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!accounts) return [];
    
    try {
      return JSON.parse(accounts);
    } catch (e) {
      console.error("Failed to parse accounts:", e);
      return [];
    }
  },
  
  saveAccount(account: GeneratedAccount): void {
    const accounts = this.getAccounts();
    accounts.push(account);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  },
  
  deleteAccount(id: string): void {
    const accounts = this.getAccounts();
    const updatedAccounts = accounts.filter((account) => account.id !== id);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
  },
  
  clearAccounts(): void {
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
  }
};
