import { Component } from '@angular/core';
import { CargoDetailsComponent } from '../cargo-details/cargo-details.component';
import { RouteShipmentComponent } from '../route-shipment/route-shipment.component';
import { ModeOfTransportComponent } from '../mode-of-transport/mode-of-transport.component';
import { CalculatorService } from '../../services/calculator.service';

@Component({
  selector: 'app-stepper',
  imports: [CargoDetailsComponent, RouteShipmentComponent, ModeOfTransportComponent],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss'
})
export class StepperComponent {
  constructor(public calculatorService: CalculatorService) {}

  toggleStep(step: number): void {
    if (step <= this.calculatorService.currentStep()) {
      this.calculatorService.goToStep(step);
    }
  }
}
