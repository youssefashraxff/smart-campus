import { Component, inject, signal } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ApiService } from '../../core/api.service';
import { Facility } from '../../core/models';

@Component({
  selector: 'app-facilities-page',
  imports: [HlmCardImports, HlmButtonImports, HlmBadgeImports, HlmInputImports],
  templateUrl: './facilities.page.html',
})
export class FacilitiesPage {
  private readonly api = inject(ApiService);

  protected readonly facilities = signal<Facility[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.search('');
  }

  protected search(q: string) {
    this.loading.set(true);
    this.error.set(null);
    this.api.searchFacilities({ q }).subscribe({
      next: (rows) => {
        this.facilities.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not reach the gateway on localhost:5000. Is the backend running?');
        this.loading.set(false);
      },
    });
  }
}
