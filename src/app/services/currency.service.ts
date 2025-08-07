import { Injectable, signal } from '@angular/core';

export type Currency = 'EUR' | 'BGN';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  exchangeRate: number; // Rate to EUR (1 EUR = 1.95583 BGN)
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private currencySignal = signal<Currency>('EUR');
  private showBothCurrenciesSignal = signal<boolean>(true);
  
  public currency = this.currencySignal.asReadonly();
  public showBothCurrencies = this.showBothCurrenciesSignal.asReadonly();

  private readonly currencies: Record<Currency, CurrencyConfig> = {
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      exchangeRate: 1
    },
    BGN: {
      code: 'BGN',
      symbol: 'лв',
      name: 'Bulgarian Lev',
      exchangeRate: 1.95583
    }
  };

  constructor() {
    // Load saved preferences
    const savedCurrency = localStorage.getItem('preferredCurrency') as Currency;
    const savedShowBoth = localStorage.getItem('showBothCurrencies');
    
    if (savedCurrency && this.currencies[savedCurrency]) {
      this.currencySignal.set(savedCurrency);
    }
    
    if (savedShowBoth !== null) {
      this.showBothCurrenciesSignal.set(savedShowBoth === 'true');
    }
  }

  setCurrency(currency: Currency) {
    this.currencySignal.set(currency);
    localStorage.setItem('preferredCurrency', currency);
  }

  setShowBothCurrencies(show: boolean) {
    this.showBothCurrenciesSignal.set(show);
    localStorage.setItem('showBothCurrencies', show.toString());
  }

  getCurrentCurrency(): CurrencyConfig {
    return this.currencies[this.currency()];
  }

  getCurrencyConfig(currency: Currency): CurrencyConfig {
    return this.currencies[currency];
  }

  convertToCurrency(amountEUR: number, targetCurrency: Currency): number {
    const targetConfig = this.currencies[targetCurrency];
    return amountEUR * targetConfig.exchangeRate;
  }

  convertFromCurrency(amount: number, sourceCurrency: Currency): number {
    const sourceConfig = this.currencies[sourceCurrency];
    return amount / sourceConfig.exchangeRate;
  }

  formatPrice(amountEUR: number, currency: Currency = this.currency()): string {
    const config = this.currencies[currency];
    const convertedAmount = this.convertToCurrency(amountEUR, currency);
    return `${config.symbol}${convertedAmount.toFixed(2)}`;
  }

  formatPriceRange(amountEUR: number): string {
    // Ensure amountEUR is a number
    const amount = typeof amountEUR === 'number' ? amountEUR : Number(amountEUR) || 0;
    
    const currentCurrency = this.currency();
    const currentConfig = this.currencies[currentCurrency];
    const convertedAmount = this.convertToCurrency(amount, currentCurrency);
    
    if (this.showBothCurrencies() && currentCurrency === 'BGN') {
      // Show BGN with EUR in parentheses
      return `${currentConfig.symbol}${convertedAmount.toFixed(2)} (€${amount.toFixed(2)})`;
    } else if (this.showBothCurrencies() && currentCurrency === 'EUR') {
      // Show EUR with BGN in parentheses
      const bgnAmount = this.convertToCurrency(amount, 'BGN');
      return `${currentConfig.symbol}${amount.toFixed(2)} (${bgnAmount.toFixed(2)} лв.)`;
    } else {
      // Show only current currency
      return `${currentConfig.symbol}${convertedAmount.toFixed(2)}`;
    }
  }

  getAvailableCurrencies(): CurrencyConfig[] {
    return Object.values(this.currencies);
  }
}
