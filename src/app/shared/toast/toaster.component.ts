import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts$ | async; track toast.id) {
      <div class="toast" [class]="'toast-' + toast.type">
        <div class="toast-icon">
          @switch (toast.type) {
            @case ('success') {
              <i class="fas fa-check-circle"></i>
            }
            @case ('error') {
              <i class="fas fa-exclamation-circle"></i>
            }
            @case ('warning') {
              <i class="fas fa-exclamation-triangle"></i>
            }
            @case ('info') {
              <i class="fas fa-info-circle"></i>
            }
          }
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="removeToast(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .toast-success {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .toast-error {
      background: linear-gradient(135deg, #dc3545, #e74c3c);
      color: white;
    }

    .toast-warning {
      background: linear-gradient(135deg, #ffc107, #fd7e14);
      color: #212529;
    }

    .toast-info {
      background: linear-gradient(135deg, #17a2b8, #6f42c1);
      color: white;
    }

    .toast-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `]
})
export class ToasterComponent {
  constructor(private toastService: ToastService) {}

  get toasts$() {
    return this.toastService.toasts$;
  }

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}
