import { Injectable, signal, computed, inject } from '@angular/core';
import { CargoDetails, RouteDetails, TransportMode, Leg, EmissionResult, ShipmentData, LegEmissionResult } from '../models/calculator.model';
import { ApiService, TruckTypeItem } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {
  private apiService = inject(ApiService);

  currentStep = signal<number>(1);
  totalSteps = 3;

  cargo = signal<CargoDetails>({ amount: 0, unit: 'KG' as 'KG' | 'TON' | 'MT' });
  route = signal<RouteDetails>({ origin: '', distance: 0, distanceUnit: 'KM', startingCountry: '' });
  transport = signal<TransportMode>({ type: 'Road', icon: 'local_shipping' });
  legs = signal<Leg[]>([]);
  routeLegs = signal<Leg[]>([]);
  showResults = signal<boolean>(false);
  loading = signal<boolean>(false);

  // IP-based calculation limit (from backend)
  private readonly MAX_CALCULATIONS = 10;
  calculationCount = signal<number>(0);
  remainingCalculations = signal<number>(10);
  limitReached = signal<boolean>(false);

  // API-driven data
  backendTruckTypes = signal<TruckTypeItem[]>([]);
  tkmValue = signal<number>(0);
  legEmissions = signal<Map<number, LegEmissionResult>>(new Map());
  totalCarbonEmission = signal<number>(0);

  transportModes: TransportMode[] = [
    { type: 'Road', icon: 'local_shipping' },
    { type: 'Rail', icon: 'train' },
    { type: 'Air', icon: 'flight' },
    { type: 'Inland Waterway', icon: 'directions_boat' },
    { type: 'Sea', icon: 'sailing' }
  ];

  availableModes: TransportMode[] = [
    { type: 'Road', icon: 'local_shipping' },
    { type: 'Rail', icon: 'train' }
  ];

  tkm = computed(() => {
    return this.tkmValue();
  });

  emissionResult = computed<EmissionResult>(() => {
    const emissions = this.legEmissions();
    const tkmVal = this.tkmValue();

    let totalWTT = 0;
    let totalTTW = 0;
    let totalEmissions = 0;

    emissions.forEach((e) => {
      totalWTT += e.WTT;
      totalTTW += e.TTW;
      totalEmissions += e.carbonEmissionValue;
    });

    const total = totalWTT + totalTTW;
    const wttPercent = total > 0 ? (totalWTT / total) * 100 : 22.77;
    const ttwPercent = total > 0 ? (totalTTW / total) * 100 : 77.23;

    return {
      totalEmissions: Math.round(totalEmissions * 1000) / 1000,
      activity: Math.round(tkmVal * 1000) / 1000,
      intensity: tkmVal > 0 ? Math.round((totalEmissions / tkmVal) * 1000) / 1000 : 0,
      wellToTank: Math.round(totalWTT * 1000) / 1000,
      wellToTankPercent: Math.round(wttPercent * 100) / 100,
      tankToWheel: Math.round(totalTTW * 1000) / 1000,
      tankToWheelPercent: Math.round(ttwPercent * 100) / 100
    };
  });

  constructor() {
    this.loadTruckTypes();
    this.loadLimit();
  }

  async loadLimit(): Promise<void> {
    try {
      const res = await firstValueFrom(this.apiService.checkLimit());
      if (res.status === 200) {
        this.remainingCalculations.set(res.remaining);
        this.limitReached.set(res.limitReached);
        this.calculationCount.set(res.maxCalculations - res.remaining);
      }
    } catch (err) {
      console.error('Failed to check limit:', err);
    }
  }

  async loadTruckTypes(): Promise<void> {
    try {
      const res = await firstValueFrom(this.apiService.getTruckTypes());
      if (res.status === 200 && res.truckTypes) {
        this.backendTruckTypes.set(res.truckTypes);
      }
    } catch (err) {
      console.error('Failed to load truck types:', err);
    }
  }

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

  // Backend fuel types for Road mode
  roadFuelTypes = ['Diesel', 'CNG', 'LNG', 'Electric', 'Hydrogen'];
  // Backend fuel types for Rail mode
  railFuelTypes = ['Diesel', 'Electric'];

  fuelTypes = ['Diesel', 'CNG', 'LNG', 'Electric', 'Hydrogen'];

  railTypes = ['Freight Train', 'Intermodal'];
  airTypes = ['Cargo Aircraft', 'Belly Freight'];
  seaTypes = ['Container Ship', 'Bulk Carrier', 'Tanker'];
  waterwayTypes = ['Barge', 'Inland Vessel'];

  getVehicleTypes(modeType: string): string[] {
    switch (modeType) {
      case 'Road': return this.backendTruckTypes().length > 0 ? this.backendTruckTypes().map(t => t.fullType) : ['Truck - Rigid (HDV >31.0 t GVW)'];
      case 'Rail': return this.railTypes;
      case 'Air': return this.airTypes;
      case 'Sea': return this.seaTypes;
      case 'Inland Waterway': return this.waterwayTypes;
      default: return this.backendTruckTypes().map(t => t.fullType);
    }
  }

  getTruckTypeByFullType(fullType: string): TruckTypeItem | undefined {
    return this.backendTruckTypes().find(t => t.fullType === fullType);
  }

  getFuelTypesForMode(modeType: string): string[] {
    switch (modeType) {
      case 'Road': return this.roadFuelTypes;
      case 'Rail': return this.railFuelTypes;
      default: return this.fuelTypes;
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

  // Map frontend mode to backend mode
  private mapMode(frontendMode: string): string {
    switch (frontendMode) {
      case 'Road': return 'ByRoad';
      case 'Rail': return 'ByTrain';
      default: return 'ByRoad';
    }
  }

  // Map frontend fuel type to backend fuel type
  private mapFuelType(frontendFuel: string): string {
    switch (frontendFuel) {
      case 'Diesel': return 'diesel';
      case 'CNG': return 'cng only';
      case 'LNG': return 'lng';
      case 'Electric': return 'electric';
      case 'Hydrogen': return 'hydrogen';
      default: return 'diesel';
    }
  }

  async calculateTKM(): Promise<void> {
    if (this.limitReached()) {
      return;
    }

    const cargoData = this.cargo();
    const routeData = this.route();
    const transportData = this.transport();
    const existingRouteLegs = this.routeLegs();

    // Convert weight to tonnes for backend
    const weightInTonnes = cargoData.unit === 'KG' ? cargoData.amount / 1000 : cargoData.amount; // TON and MT are both tonnes
    const distanceInKm = routeData.distanceUnit === 'MI' ? routeData.distance * 1.60934 : routeData.distance;

    this.loading.set(true);

    try {
      // Call backend /calculateTKM
      const tkmRes = await firstValueFrom(this.apiService.calculateTKM({
        weight: weightInTonnes,
        distance: distanceInKm,
        mode: this.mapMode(transportData.type)
      }));

      if (tkmRes.status === 429) {
        this.limitReached.set(true);
        this.remainingCalculations.set(0);
        return;
      }

      if (tkmRes.status === 200 && tkmRes.shipmentDetails) {
        this.tkmValue.set(parseFloat(tkmRes.shipmentDetails.tkm));
        if (tkmRes.remaining !== undefined) {
          this.remainingCalculations.set(tkmRes.remaining);
          this.limitReached.set(tkmRes.limitReached ?? false);
          this.calculationCount.set(this.MAX_CALCULATIONS - tkmRes.remaining);
        }
      }

      // Set up legs
      const defaultTruckObj = this.backendTruckTypes().length > 0 ? this.backendTruckTypes()[0] : null;
      const defaultTruckType = transportData.type === 'Road'
        ? (defaultTruckObj ? defaultTruckObj.fullType : 'Truck - Rigid (HDV >31.0 t GVW)')
        : this.railTypes[0];

      const defaultFuelType = transportData.type === 'Road' ? 'Diesel' : 'Diesel';

      if (existingRouteLegs.length > 0) {
        this.legs.set(existingRouteLegs);
      } else {
        this.legs.set([{
          id: 1,
          mode: transportData,
          distance: distanceInKm,
          truckType: defaultTruckType,
          vehicleType: defaultTruckObj?.vehicleType,
          avgWeight: defaultTruckObj?.avgWeight,
          fuelType: defaultFuelType,
          editing: false
        }]);
      }

      // Calculate emission for the first leg
      await this.calculateAllLegEmissions();

      this.showResults.set(true);
    } catch (err) {
      console.error('Error calculating TKM:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async calculateLegEmission(leg: Leg, previousCarbonEmission: number = 0): Promise<LegEmissionResult | null> {
    const cargoData = this.cargo();
    const weightInTonnes = cargoData.unit === 'KG' ? cargoData.amount / 1000 : cargoData.amount;
    const legTkm = weightInTonnes * leg.distance;
    const backendMode = this.mapMode(leg.mode.type);
    const backendFuel = this.mapFuelType(leg.fuelType || 'Diesel');

    // Use vehicleType and avgWeight from the truck type object
    const vehicleType = leg.vehicleType || 'Rigid';
    const vehicleWeight = leg.avgWeight ?? weightInTonnes;

    try {
      const res = await firstValueFrom(this.apiService.calculateCarbonEmission({
        tkm: legTkm,
        mode: backendMode,
        fuelType: backendFuel,
        vehicleType: vehicleType,
        weight: vehicleWeight,
        previousCarbonEmission
      }));

      if (res.status === 200 && res.responseData) {
        const data = res.responseData;
        return {
          carbonEmissionValue: parseFloat(data.carbonEmissionValue) || 0,
          WTT: parseFloat(data.WTT || '0'),
          TTW: parseFloat(data.TTW || '0'),
          WTW: parseFloat(data.WTW || '0'),
          aversionValue: data.aversionValue ? parseFloat(data.aversionValue) : undefined,
          totalCarbonEmission: parseFloat(data.totalCarbonEmission) || 0
        };
      }
    } catch (err) {
      console.error('Error calculating emission for leg:', leg.id, err);
    }
    return null;
  }

  async calculateAllLegEmissions(): Promise<void> {
    const currentLegs = this.legs();
    const newEmissions = new Map<number, LegEmissionResult>();
    let cumulativeEmission = 0;

    for (const leg of currentLegs) {
      if (leg.distance <= 0) continue;

      const result = await this.calculateLegEmission(leg, cumulativeEmission);
      if (result) {
        cumulativeEmission += result.carbonEmissionValue;
        newEmissions.set(leg.id, result);
      }
    }

    this.legEmissions.set(newEmissions);
    this.totalCarbonEmission.set(cumulativeEmission);
  }

  getLegEmission(leg: Leg): number {
    const emissions = this.legEmissions();
    const legResult = emissions.get(leg.id);
    return legResult ? legResult.carbonEmissionValue : 0;
  }

  getLegEmissionResult(leg: Leg): LegEmissionResult | undefined {
    return this.legEmissions().get(leg.id);
  }

  addLeg(): void {
    const currentLegs = this.legs();
    const defaultTruckObj = this.backendTruckTypes().length > 0 ? this.backendTruckTypes()[0] : null;
    const newLeg: Leg = {
      id: currentLegs.length + 1,
      mode: { type: 'Road', icon: 'local_shipping' },
      distance: 0,
      truckType: defaultTruckObj ? defaultTruckObj.fullType : 'Truck - Rigid (HDV >31.0 t GVW)',
      vehicleType: defaultTruckObj?.vehicleType,
      avgWeight: defaultTruckObj?.avgWeight,
      fuelType: 'Diesel',
      editing: true
    };
    this.legs.update(legs => [...legs, newLeg]);
  }

  async updateLeg(updatedLeg: Leg): Promise<void> {
    this.legs.update(legs => legs.map(l => l.id === updatedLeg.id ? updatedLeg : l));

    // Recalculate emissions if leg is no longer editing and has valid distance
    if (!updatedLeg.editing && updatedLeg.distance > 0) {
      // Recalculate TKM based on total distance
      const cargoData = this.cargo();
      const weightInTonnes = cargoData.unit === 'KG' ? cargoData.amount / 1000 : cargoData.amount;
      const totalDistance = this.legs().reduce((sum, l) => sum + l.distance, 0);
      this.tkmValue.set(parseFloat((weightInTonnes * totalDistance).toFixed(3)));

      await this.calculateAllLegEmissions();
    }
  }

  async removeLeg(id: number): Promise<void> {
    this.legs.update(legs => legs.filter(l => l.id !== id));

    // Recalculate
    const cargoData = this.cargo();
    const weightInTonnes = cargoData.unit === 'KG' ? cargoData.amount / 1000 : cargoData.amount;
    const totalDistance = this.legs().reduce((sum, l) => sum + l.distance, 0);
    this.tkmValue.set(parseFloat((weightInTonnes * totalDistance).toFixed(3)));

    await this.calculateAllLegEmissions();
  }

  restart(): void {
    this.currentStep.set(1);
    this.cargo.set({ amount: 0, unit: 'KG' });
    this.route.set({ origin: '', distance: 0, distanceUnit: 'KM', startingCountry: '' });
    this.transport.set({ type: 'Road', icon: 'local_shipping' });
    this.legs.set([]);
    this.routeLegs.set([]);
    this.showResults.set(false);
    this.tkmValue.set(0);
    this.legEmissions.set(new Map());
    this.totalCarbonEmission.set(0);
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
