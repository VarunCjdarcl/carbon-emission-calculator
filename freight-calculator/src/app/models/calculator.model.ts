export interface CargoDetails {
  amount: number;
  unit: 'KG' | 'TON' | 'MT';
}

export interface RouteDetails {
  origin: string;
  distance: number;
  distanceUnit: 'KM' | 'MI';
  startingCountry: string;
}

export interface TransportMode {
  type: 'Road' | 'Rail' | 'Air' | 'Inland Waterway' | 'Sea';
  icon: string;
}

export interface TruckType {
  fullType: string;
  vehicleType: string;
  avgWeight: number;
}

export interface Leg {
  id: number;
  mode: TransportMode;
  distance: number;
  truckType?: string;
  vehicleType?: string;
  avgWeight?: number;
  fuelType?: string;
  editing: boolean;
}

export interface EmissionResult {
  totalEmissions: number;
  activity: number;
  intensity: number;
  wellToTank: number;
  wellToTankPercent: number;
  tankToWheel: number;
  tankToWheelPercent: number;
}

export interface LegEmissionResult {
  carbonEmissionValue: number;
  WTT: number;
  TTW: number;
  WTW: number;
  aversionValue?: number;
  totalCarbonEmission: number;
}

export interface ShipmentData {
  cargo: CargoDetails;
  route: RouteDetails;
  transport: TransportMode;
  legs: Leg[];
  shipmentDate: string;
  autoRouting: boolean;
  autoTransshipment: boolean;
}
