import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// const BASE_URL = 'http://localhost:8000/carbonEmission';
const BASE_URL = 'http://cecalculator.cjdarcl.com:8080/carbonEmission';

export interface TkmRequest {
  weight: number;
  distance: number;
  mode: string;
}

export interface TkmResponse {
  status: number;
  shipmentDetails?: {
    weight: number;
    distance: number;
    mode: string;
    tkm: string;
  };
  message?: string;
}

export interface EmissionRequest {
  tkm: number;
  mode: string;
  fuelType: string;
  vehicleType: string;
  weight: number;
  previousCarbonEmission?: number;
}

export interface EmissionResponse {
  status: number;
  responseData?: {
    tkm: number;
    mode: string;
    fuelType: string;
    vehicleType: string;
    weight: number;
    carbonEmissionValue: string;
    WTT?: string;
    TTW?: string;
    WTW?: string;
    aversionValue?: string;
    totalCarbonEmission: string;
  };
  message?: string;
}

export interface TruckTypesResponse {
  status: number;
  truckTypes?: string[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  calculateTKM(payload: TkmRequest): Observable<TkmResponse> {
    return this.http.post<TkmResponse>(`${BASE_URL}/calculateTKM`, payload);
  }

  calculateCarbonEmission(payload: EmissionRequest): Observable<EmissionResponse> {
    return this.http.post<EmissionResponse>(`${BASE_URL}/calculateCarbonEmission`, payload);
  }

  getTruckTypes(): Observable<TruckTypesResponse> {
    return this.http.post<TruckTypesResponse>(`${BASE_URL}/truckTypes`, {});
  }
}
