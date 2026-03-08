import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream px-4">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Algo correu mal</h2>
            <p className="text-gray-500 mb-2 text-sm font-mono break-all">
              {this.state.error?.message}
            </p>
            <p className="text-gray-600 mb-8">
              Ocorreu um erro inesperado. Tenta recarregar a página.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tentar novamente
              </button>
              <a
                href="/"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar ao início
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
