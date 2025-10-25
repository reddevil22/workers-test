import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { authService, User, LoginRequest, RegisterRequest } from "./Auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthStore {
  private stateSubject$ = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  public state$(): Observable<AuthState> {
    return this.stateSubject$.asObservable();
  }

  public user$(): Observable<User | null> {
    return this.stateSubject$.pipe(map((state) => state.user));
  }

  public isAuthenticated$(): Observable<boolean> {
    return this.stateSubject$.pipe(map((state) => state.isAuthenticated));
  }

  public isLoading$(): Observable<boolean> {
    return this.stateSubject$.pipe(map((state) => state.isLoading));
  }

  public error$(): Observable<string | null> {
    return this.stateSubject$.pipe(map((state) => state.error));
  }

  public isAdmin$(): Observable<boolean> {
    return this.stateSubject$.pipe(
      map((state) => state.user?.role === "admin")
    );
  }

  private updateState(updates: Partial<AuthState>) {
    const currentState = this.stateSubject$.value;
    this.stateSubject$.next({ ...currentState, ...updates });
  }

  public initialize(): void {
    const token = authService.getToken();
    if (token) {
      this.updateState({ isLoading: true, error: null });

      authService
        .getCurrentUser(token)
        .then((user) => {
          this.updateState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        })
        .catch(() => {
          this.updateState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Session expired",
          });
        });
    }
  }

  public login(credentials: LoginRequest): Observable<User> {
    this.updateState({ isLoading: true, error: null });

    return new Observable<User>((observer) => {
      authService
        .login(credentials)
        .then((response) => {
          authService.storeToken(response.token);
          this.updateState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          observer.next(response.user);
          observer.complete();
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "Login failed";
          this.updateState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          observer.error(error);
        });
    });
  }

  public register(userData: RegisterRequest): Observable<User> {
    this.updateState({ isLoading: true, error: null });

    return new Observable<User>((observer) => {
      authService
        .register(userData)
        .then((response) => {
          authService.storeToken(response.token);
          this.updateState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          observer.next(response.user);
          observer.complete();
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "Registration failed";
          this.updateState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          observer.error(error);
        });
    });
  }

  public logout(): void {
    authService.removeToken();
    this.updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  public clearError(): void {
    this.updateState({ error: null });
  }

  public getAuthToken(): string | null {
    return authService.getToken();
  }

  public getCurrentState(): AuthState {
    return this.stateSubject$.value;
  }
}

export const authStore = new AuthStore();
