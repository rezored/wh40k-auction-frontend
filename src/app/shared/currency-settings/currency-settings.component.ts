import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService, Currency } from '../../services/currency.service';

@Component({
  selector: 'app-currency-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="currency-settings">
      <h5><i class="fas fa-euro-sign me-2"></i>Currency Settings</h5>
      
      <div class="mb-3">
        <label class="form-label">Preferred Currency</label>
        <select class="form-select" 
                [(ngModel)]="selectedCurrency" 
                (change)="onCurrencyChange()">
          <option *ngFor="let currency of availableCurrencies" 
                  [value]="currency.code">
            {{ currency.name }} ({{ currency.symbol }})
          </option>
        </select>
      </div>
      
      <div class="mb-3 form-check">
        <input type="checkbox" 
               class="form-check-input" 
               id="showBothCurrencies"
               [(ngModel)]="showBothCurrencies" 
               (change)="onShowBothChange()">
        <label class="form-check-label" for="showBothCurrencies">
          Show both currencies (EUR and лв)
        </label>
        <small class="form-text text-muted">
          When enabled, prices will show in your preferred currency with the other currency in parentheses.
        </small>
      </div>
      
      <div class="preview-section">
        <h6>Preview</h6>
        <div class="preview-item">
          <span class="preview-label">Sample Price:</span>
          <span class="preview-value">{{ formatPrice(100) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .currency-settings {
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .preview-section {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .preview-label {
      font-weight: 500;
      color: #6c757d;
    }
    
    .preview-value {
      font-weight: bold;
      color: #28a745;
    }
  `]
})
export class CurrencySettingsComponent {
  selectedCurrency: Currency = 'EUR';
  showBothCurrencies: boolean = true;

  constructor(public currencyService: CurrencyService) {
    this.selectedCurrency = this.currencyService.currency();
    this.showBothCurrencies = this.currencyService.showBothCurrencies();
  }

  get availableCurrencies() {
    return this.currencyService.getAvailableCurrencies();
  }

  onCurrencyChange() {
    this.currencyService.setCurrency(this.selectedCurrency);
  }

  onShowBothChange() {
    this.currencyService.setShowBothCurrencies(this.showBothCurrencies);
  }

  formatPrice(amountEUR: number): string {
    return this.currencyService.formatPriceRange(amountEUR);
  }
}
