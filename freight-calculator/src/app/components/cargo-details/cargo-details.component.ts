import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalculatorService } from '../../services/calculator.service';

@Component({
  selector: 'app-cargo-details',
  imports: [FormsModule],
  templateUrl: './cargo-details.component.html',
  styleUrl: './cargo-details.component.scss'
})
export class CargoDetailsComponent {
  amount: number | null = null;
  unit: 'KG' | 'TON' | 'MT' = 'KG';

  constructor(private calculatorService: CalculatorService) {
    const cargo = this.calculatorService.cargo();
    this.amount = cargo.amount || null;
    this.unit = cargo.unit;
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (this.unit === 'TON' || this.unit === 'MT') {
      // Remove anything that's not a digit or dot
      value = value.replace(/[^0-9.]/g, '');

      // Only allow one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }

      // Max 2 digits before decimal
      if (parts[0].length > 2) {
        parts[0] = parts[0].slice(0, 2);
        value = parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];
      }

      // Max 2 digits after decimal
      if (parts.length > 1 && parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
        value = parts[0] + '.' + parts[1];
      }

      // Cap at 99.99
      const numValue = parseFloat(value);
      if (numValue > 99.99) {
        value = '99.99';
      }

      input.value = value;
      this.amount = value ? parseFloat(value) : null;
    } else {
      this.amount = value ? parseFloat(value) : null;
    }
  }

  onUnitChange(): void {
    if ((this.unit === 'TON' || this.unit === 'MT') && this.amount !== null && this.amount > 99.99) {
      this.amount = 99.99;
    }
  }

  get isValid(): boolean {
    return this.amount !== null && this.amount > 0;
  }

  onNext(): void {
    if (this.isValid) {
      this.calculatorService.cargo.set({ amount: this.amount!, unit: this.unit });
      this.calculatorService.nextStep();
    }
  }
}
