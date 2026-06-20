"use client";
import React from "react";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-6">
          <div className="text-center max-w-sm">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Ocurrió un error inesperado
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Recarga la página para intentarlo de nuevo.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
