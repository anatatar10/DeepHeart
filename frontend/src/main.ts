// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; // Make sure you have this file
import { provideHttpClient } from '@angular/common/http';

// Updated app config with animations
const updatedAppConfig = {
  providers: [
    ...appConfig.providers,
    provideAnimationsAsync(), // This fixes the toast animation error
    provideHttpClient(),
    provideRouter(routes)
  ]
};

bootstrapApplication(AppComponent, updatedAppConfig)
  .catch((err) => console.error(err));
