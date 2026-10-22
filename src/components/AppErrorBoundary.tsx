import React from "react";

type State = {
  error: Error | null;
};

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Iris crashed", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="crash-screen">
        <div className="crash-card">
          <p className="eyebrow">Iris recovered from a runtime crash</p>
          <h1>The app hit an unexpected graph state.</h1>
          <p>
            Your project autosave is still available. Reload Iris to reopen the workspace; if it happens again,
            the browser console will show the exact component that failed.
          </p>
          <pre>{this.state.error.message}</pre>
          <button className="btn primary" onClick={() => window.location.reload()}>Reload Iris</button>
        </div>
      </div>
    );
  }
}
