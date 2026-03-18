import { Component } from '@angular/core';
import { CalculatorService } from '../../services/calculator.service';
import { TransportMode } from '../../models/calculator.model';

@Component({
  selector: 'app-mode-of-transport',
  imports: [],
  templateUrl: './mode-of-transport.component.html',
  styleUrl: './mode-of-transport.component.scss'
})
export class ModeOfTransportComponent {
  selectedMode: TransportMode;
  availableModes: TransportMode[];

  constructor(public calculatorService: CalculatorService) {
    this.selectedMode = this.calculatorService.transport();
    this.availableModes = this.calculatorService.transportModes.filter(
      m => m.type === 'Road' || m.type === 'Rail'
    );
  }

  selectMode(mode: TransportMode): void {
    this.selectedMode = mode;
    this.calculatorService.transport.set(mode);
  }

  async onCalculateTKM(): Promise<void> {
    await this.calculatorService.calculateTKM();
  }
}
