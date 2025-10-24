import { Subject, interval } from "rxjs";
import { switchMap } from "rxjs/operators";

export const usersUpdates$ = new Subject<void>();

// Simple poller: every 15s emit an update signal (could be replaced with SSE or WebSocket)
interval(15000)
  .pipe(
    switchMap(() => {
      return new Promise<void>((resolve) => resolve());
    })
  )
  .subscribe(() => usersUpdates$.next());
