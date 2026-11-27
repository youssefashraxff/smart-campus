import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToaster } from '@spartan-ng/helm/sonner';
import { WakingIndicator } from './shared/waking-indicator';

@Component({
  imports: [RouterOutlet, HlmToaster, WakingIndicator],
  selector: 'app-root',
  template: `
    <router-outlet />
    <hlm-toaster position="bottom-right" [closeButton]="true" />
    <app-waking-indicator />
  `,
})
export class App {}
