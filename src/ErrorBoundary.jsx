import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell" style={{ background: 'linear-gradient(135deg, #f1d7d7 0%, #f0a1a1 100%)' }}>
          <section className="weather-card">
            <h2>Something went wrong.</h2>
            <p>{this.state.message || 'The weather app hit an unexpected issue.'}</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
