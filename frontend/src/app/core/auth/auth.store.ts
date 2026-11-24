import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models';

const STORAGE_KEY = 'smart-campus.session';

interface Session {
  token: string;
  user: User;
}

/**
 * Holds the signed-in user and their JWT (FR-U2).
 * The token is kept in localStorage so a page refresh keeps you signed in; the auth interceptor adds it
 * to every request, and the gateway validates it (FR-C4). Logging out only forgets the token: a JWT is
 * stateless, so there is nothing to tell the server.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = `${environment.apiBaseUrl}/auth`;

  private readonly session = signal<Session | null>(readSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isSignedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  readonly firstName = computed(() => {
    const name = this.user()?.name ?? '';
    // "Dr. Mona Abdelaziz" -> "Mona", "Ahmed Mostafa" -> "Ahmed"
    const parts = name.split(' ').filter((p) => !/^(dr|eng|prof)\.?$/i.test(p));
    return parts[0] ?? name;
  });

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, request)
      .pipe(tap((res) => this.save({ token: res.token, user: res.user })));
  }

  /** Register returns the new user without a token (AuthController), so sign in right after */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<User>(`${this.api}/register`, request)
      .pipe(switchMap(() => this.login({ email: request.email, password: request.password })));
  }

  /** Refreshes the stored user from GET /api/auth/me (e.g. after an admin changes a role) */
  refreshMe(): Observable<User> {
    return this.http.get<User>(`${this.api}/me`).pipe(
      tap((user) => {
        const current = this.session();
        if (current) this.save({ ...current, user });
      }),
    );
  }

  logout(redirect = true): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable (private mode); the in-memory session is already cleared
    }
    if (redirect) void this.router.navigate(['/login']);
  }

  private save(session: Session): void {
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore: the user stays signed in until the tab closes
    }
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return isExpired(session.token) ? null : session;
  } catch {
    return null;
  }
}

/** Reads the exp claim from the JWT payload. The signature is checked by the gateway, not here. */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}
