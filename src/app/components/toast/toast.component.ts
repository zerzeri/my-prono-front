// src/app/components/toast/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      <div *ngFor="let toast of toastService.toasts()"
           class="toast" [class]="'toast-' + toast.type"
           (click)="toastService.dismiss(toast.id)">
        <span class="toast-icon">{{ icon(toast.type) }}</span>
        <span class="toast-msg">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      flex-direction: column-reverse;
      gap: 0.6rem;
      width: min(360px, calc(100vw - 2rem));
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: var(--navy);
      color: #fff;
      box-shadow: 0 10px 25px -5px rgba(16, 24, 40, 0.35);
      border-left: 4px solid var(--muted);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      animation: toast-in 0.25s ease;
    }

    .toast-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
      color: var(--navy);
      background: #fff;
    }

    .toast-msg {
      flex: 1;
    }

    .toast-success { border-left-color: #34d399; }
    .toast-success .toast-icon { color: #047857; }

    .toast-error { border-left-color: #f97066; }
    .toast-error .toast-icon { color: #b42318; }

    .toast-info { border-left-color: #53b1fd; }
    .toast-info .toast-icon { color: #175cd3; }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (min-width: 700px) {
      .toast-container {
        left: auto;
        right: 1.5rem;
        bottom: 1.5rem;
        transform: none;
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  icon(type: ToastType): string {
    return type === 'success' ? '✓' : type === 'error' ? '✕' : 'i';
  }
}
