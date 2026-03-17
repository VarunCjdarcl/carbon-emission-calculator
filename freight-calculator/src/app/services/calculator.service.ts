import { Injectable, signal, computed } from '@angular/core';
import { CargoDetails, RouteDetails, TransportMode, Leg, EmissionResult, ShipmentData } from '../models/calculator.model';

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {
  currentStep = signal<number>(1);
  totalSteps = 3;

  cargo = signal<CargoDetails>({ amount: 0, unit: 'KG' });
  route = signal<RouteDetails>({ origin: '', distance: 0, distanceUnit: 'KM', startingCountry: '' });
  transport = signal<TransportMode>({ type: 'Road', icon: 'local_shipping' });
  legs = signal<Leg[]>([]);
  routeLegs = signal<Leg[]>([]);
  showResults = signal<boolean>(false);

  transportModes: TransportMode[] = [
    { type: 'Road', icon: 'local_shipping' },
    { type: 'Rail', icon: 'train' },
    { type: 'Air', icon: 'flight' },
    { type: 'Inland Waterway', icon: 'directions_boat' },
    { type: 'Sea', icon: 'sailing' }
  ];

  tkm = computed(() => {
    const cargoData = this.cargo();
    const routeData = this.route();
    const weightInTonnes = cargoData.unit === 'KG' ? cargoData.amount / 1000 : cargoData.amount;
    const distanceInKm = routeData.distanceUnit === 'MI' ? routeData.distance * 1.60934 : routeData.distance;
    return weightInTonnes * distanceInKm;
  });

  emissionResult = computed<EmissionResult>(() => {
    const tkmValue = this.tkm();
    const mode = this.transport();

    const factors: Record<string, number> = {
      'Road': 0.123,
      'Rail': 0.028,
      'Air': 0.602,
      'Inland Waterway': 0.031,
      'Sea': 0.008
    };

    const factor = factors[mode.type] || 0.123;
    const totalEmissions = tkmValue * factor;
    const wellToTankPercent = 22.77;
    const tankToWheelPercent = 100 - wellToTankPercent;

    return {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      activity: Math.round(tkmValue * 100) / 100,
      intensity: factor,
      wellToTank: Math.round(totalEmissions * (wellToTankPercent / 100) * 100) / 100,
      wellToTankPercent,
      tankToWheel: Math.round(totalEmissions * (tankToWheelPercent / 100) * 100) / 100,
      tankToWheelPercent
    };
  });

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep.set(step);
    }
  }

  truckTypes = ['Truck', 'Light Commercial Vehicle', 'Heavy Truck', 'Trailer Truck'];
  fuelTypes = ['Diesel', 'Petrol', 'Electric', 'CNG', 'LNG', 'Hybrid'];

  railTypes = ['Freight Train', 'Intermodal'];
  airTypes = ['Cargo Aircraft', 'Belly Freight'];
  seaTypes = ['Container Ship', 'Bulk Carrier', 'Tanker'];
  waterwayTypes = ['Barge', 'Inland Vessel'];

  getVehicleTypes(modeType: string): string[] {
    switch (modeType) {
      case 'Road': return this.truckTypes;
      case 'Rail': return this.railTypes;
      case 'Air': return this.airTypes;
      case 'Sea': return this.seaTypes;
      case 'Inland Waterway': return this.waterwayTypes;
      default: return this.truckTypes;
    }
  }

  getVehicleLabel(modeType: string): string {
    switch (modeType) {
      case 'Road': return 'Truck type';
      case 'Rail': return 'Rail type';
      case 'Air': return 'Aircraft type';
      case 'Sea': return 'Vessel type';
      case 'Inland Waterway': return 'Vessel type';
      default: return 'Vehicle type';
    }
  }

  emissionFactors: Record<string, number> = {
    'Road': 0.123,
    'Rail': 0.028,
    'Air': 0.602,
    'Inland Waterway': 0.031,
    'Sea': 0.008
  };

  getLegEmission(leg: Leg): number {
    const cargoData = this.cargo();
    const weightInTonnes = cargoData.unit === 'KG' ? cargoData.amount / 1000 : cargoData.amount;
    const factor = this.emissionFactors[leg.mode.type] || 0.123;
    return Math.round(weightInTonnes * leg.distance * factor * 100) / 100;
  }

  calculateTKM(): void {
    const routeData = this.route();
    const transportData = this.transport();
    const existingRouteLegs = this.routeLegs();

    if (existingRouteLegs.length > 0) {
      this.legs.set(existingRouteLegs);
    } else {
      this.legs.set([{
        id: 1,
        mode: transportData,
        distance: routeData.distance,
        truckType: this.getVehicleTypes(transportData.type)[0],
        fuelType: 'Diesel',
        editing: false
      }]);
    }

    this.showResults.set(true);
  }

  addLeg(): void {
    const currentLegs = this.legs();
    const newLeg: Leg = {
      id: currentLegs.length + 1,
      mode: { type: 'Road', icon: 'local_shipping' },
      distance: 0,
      truckType: 'Truck',
      fuelType: 'Diesel',
      editing: true
    };
    this.legs.update(legs => [...legs, newLeg]);
  }

  updateLeg(updatedLeg: Leg): void {
    this.legs.update(legs => legs.map(l => l.id === updatedLeg.id ? updatedLeg : l));
  }

  removeLeg(id: number): void {
    this.legs.update(legs => legs.filter(l => l.id !== id));
  }

  restart(): void {
    this.currentStep.set(1);
    this.cargo.set({ amount: 0, unit: 'KG' });
    this.route.set({ origin: '', distance: 0, distanceUnit: 'KM', startingCountry: '' });
    this.transport.set({ type: 'Road', icon: 'local_shipping' });
    this.legs.set([]);
    this.routeLegs.set([]);
    this.showResults.set(false);
  }

  getShipmentData(): ShipmentData {
    return {
      cargo: this.cargo(),
      route: this.route(),
      transport: this.transport(),
      legs: this.legs(),
      shipmentDate: 'Now',
      autoRouting: false,
      autoTransshipment: false
    };
  }
}
