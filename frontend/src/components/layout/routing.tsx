import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isAdmin } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { LoadingBlock } from '../ui/Feedback';

/* -------------------------------------------------------------------------- */
/*  Route transitions                                                          */
/* -------------------------------------------------------------------------- */

/** Resets scroll on navigation and moves focus to the main landmark. */
export function RouteEffects({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    // Announce the new page to assistive tech without stealing focus.
    const main = document.getElementById('main');
    main?.setAttribute('tabindex', '-1');
    main?.focus({ preventScroll: true });
  }, [pathname]);

  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*  Guards                                                                     */
/* -------------------------------------------------------------------------- */

/** Waits for the persisted session to be read back before deciding. */
function useAuthReady() {
  const hydrated = useAuth((s) => s.hydrated);
  const user = useAuth((s) => s.user);
  return { ready: hydrated, user };
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuthReady();
  const location = useLocation();

  if (!ready) return <LoadingBlock label="Checking your session" />;
  if (!user) {
    // Remember where they were headed so sign-in can send them back.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { ready, user } = useAuthReady();
  const location = useLocation();

  if (!ready) return <LoadingBlock label="Verifying access" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin(user)) {
    return (
      <div className="shell grid min-h-[60vh] place-items-center py-20 text-center">
        <div className="max-w-md">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-ember">
            Restricted aisle
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.02]">Farmers only.</h1>
          <p className="mt-4 leading-relaxed text-ink-2">
            This area is for PradhanFresh staff. If you work with us and this looks wrong, sign in
            with your staff account.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

/** Signed-in visitors should not see the login/signup screens again. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { ready, user } = useAuthReady();
  if (!ready) return <LoadingBlock />;
  if (user) return <Navigate to="/profile" replace />;
  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*  Cart lifecycle                                                             */
/* -------------------------------------------------------------------------- */

/** Loads the cart once the session is known, and clears it on sign-out. */
export function CartLifecycle() {
  // Subscribe to the id rather than the object so a profile refresh that returns
  // a new `user` reference does not re-trigger a cart fetch.
  const userId = useAuth((s) => s.user?.id ?? null);
  const load = useCart((s) => s.load);
  const reset = useCart((s) => s.reset);

  useEffect(() => {
    if (userId != null) void load();
    else reset();
  }, [userId, load, reset]);

  return null;
}
