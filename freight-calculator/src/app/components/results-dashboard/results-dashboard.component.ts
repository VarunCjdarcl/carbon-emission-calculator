import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalculatorService } from '../../services/calculator.service';
import { DecimalPipe } from '@angular/common';
import { Leg } from '../../models/calculator.model';

@Component({
  selector: 'app-results-dashboard',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './results-dashboard.component.html',
  styleUrl: './results-dashboard.component.scss'
})
export class ResultsDashboardComponent {
  shipmentData;
  result;
  legs;

  constructor(public calculatorService: CalculatorService) {
    this.shipmentData = computed(() => this.calculatorService.getShipmentData());
    this.result = this.calculatorService.emissionResult;
    this.legs = this.calculatorService.legs;
  }

  sidebarCollapsed = false;

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  get totalDistance(): number {
    return this.legs().reduce((sum, leg) => sum + leg.distance, 0);
  }

  onRestart(): void {
    this.calculatorService.restart();
  }

  onAddLeg(): void {
    this.calculatorService.addLeg();
  }

  onRemoveLeg(id: number): void {
    this.calculatorService.removeLeg(id);
  }

  onToggleEdit(leg: Leg): void {
    this.calculatorService.updateLeg({ ...leg, editing: !leg.editing });
  }

  onLegModeChange(leg: Leg, modeType: string): void {
    const mode = this.calculatorService.transportModes.find(m => m.type === modeType);
    if (mode) {
      const vehicleTypes = this.calculatorService.getVehicleTypes(modeType);
      this.calculatorService.updateLeg({
        ...leg,
        mode,
        truckType: vehicleTypes[0],
        fuelType: 'Diesel'
      });
    }
  }

  onLegTruckTypeChange(leg: Leg, truckType: string): void {
    this.calculatorService.updateLeg({ ...leg, truckType });
  }

  onLegFuelTypeChange(leg: Leg, fuelType: string): void {
    this.calculatorService.updateLeg({ ...leg, fuelType });
  }

  formatNumber(value: number): string {
    return value.toLocaleString();
  }

  getModeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Road': 'local_shipping',
      'Rail': 'train',
      'Air': 'flight',
      'Inland Waterway': 'directions_boat',
      'Sea': 'sailing'
    };
    return icons[type] || 'local_shipping';
  }
}
