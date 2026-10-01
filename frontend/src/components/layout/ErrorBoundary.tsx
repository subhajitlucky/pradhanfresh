import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/Button';

/**
 * Catches render-time crashes so one bad page cannot white-screen the app.
 * Route-level errors are surfaced by the pages themselves; this is the last net.
 */
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PradhanFresh] Unhandled UI error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="shell grid min-h-[70vh] place-items-center py-20">
        <div className="max-w-lg text-center">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-ember">
            Something wilted
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.02]">This page didn&rsquo;t load.</h1>
          <p className="mt-4 leading-relaxed text-ink-2">
            An unexpected error stopped the page from rendering. Reloading usually clears it — if
            it keeps happening, we&rsquo;d love to hear about it.
          </p>
          <pre className="mx-auto mt-6 max-w-md overflow-x-auto rounded-md border border-rule bg-paper-card p-3 text-left font-mono text-[0.6875rem] text-ink-3">
            {error.message}
          </pre>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="ink" onClick={() => window.location.reload()}>
              Reload the page
            </Button>
            <Button variant="outline" to="/">
              Back to the market
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
