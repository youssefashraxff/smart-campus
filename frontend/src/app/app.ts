import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToaster } from '@spartan-ng/helm/sonner';

@Component({
  imports: [RouterOutlet, HlmToaster],
  selector: 'app-root',
  template: `
    <router-outlet />
    <hlm-toaster position="bottom-right" [closeButton]="true" />
  `,
})
export class App {}
