import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalculatorService } from '../../services/calculator.service';

@Component({
  selector: 'app-route-shipment',
  imports: [FormsModule],
  templateUrl: './route-shipment.component.html',
  styleUrl: './route-shipment.component.scss'
})
export class RouteShipmentComponent {
  distance = 0;
  distanceUnit: 'KM' | 'MI' = 'KM';
  showError = false;

  constructor(private calculatorService: CalculatorService) {
    const route = this.calculatorService.route();
    this.distance = route.distance;
    this.distanceUnit = route.distanceUnit;
  }

  onNext(): void {
    if (this.distance <= 0) {
      this.showError = true;
      return;
    }
    this.showError = false;
    this.calculatorService.route.set({
      origin: '',
      distance: this.distance,
      distanceUnit: this.distanceUnit,
      startingCountry: ''
    });
    this.calculatorService.nextStep();
  }
}
