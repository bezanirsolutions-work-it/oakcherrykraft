import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[calc(100vh-8rem)] bg-sand px-6 py-20 text-center text-bark md:px-10">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-bark/10 bg-white p-10 shadow-soft">
            <h1 className="mb-4 text-3xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mb-8 text-base leading-8 text-bark/75">
              Please refresh the page or come back later. If the problem persists, contact support.
            </p>
            <button
              type="button"
              className="btn-base btn-primary px-8 py-3"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
