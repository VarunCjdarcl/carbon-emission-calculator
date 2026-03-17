import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { StepperComponent } from './components/stepper/stepper.component';
import { ResultsDashboardComponent } from './components/results-dashboard/results-dashboard.component';
import { CalculatorService } from './services/calculator.service';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, StepperComponent, ResultsDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(public calculatorService: CalculatorService) {}
}
