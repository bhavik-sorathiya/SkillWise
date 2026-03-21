// client/src/components/ErrorBoundary.jsx
// React error boundary that catches rendering/runtime tree errors and shows a recovery UI.

import React from 'react';

class ErrorBoundary extends React.Component {
  // Initializes boundary state used for fallback rendering and debug counters.
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Captures error details for diagnostics and optional external reporting.
  componentDidCatch(error, errorInfo) {
    console.error('[Error Boundary] Caught error:', error);
    console.error('[Error Boundary] Error info:', errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to external error tracking service if available
    if (window.__logError) {
      window.__logError({
        message: error.toString(),
        stack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-5xl text-red-600">error_outline</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                <p className="font-mono text-xs text-gray-800 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                Go to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-500 text-center mt-4">
                Error #: {this.state.errorCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
