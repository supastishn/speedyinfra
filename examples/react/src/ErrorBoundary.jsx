import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { error: null };
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  render() {
    if (this.state.error) {
      return (
        <div className="error">
          <h2>Application Error</h2>
          <pre>{this.state.error.message}</pre>
          <p>Check console for details</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
