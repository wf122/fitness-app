import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    try {
      const parsed = JSON.parse(error.message);
      return { hasError: true, errorInfo: parsed };
    } catch {
      return { hasError: true, errorInfo: { error: error.message } };
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-rose-50">
          <div className="bg-white p-6 rounded-3xl shadow-xl max-w-md w-full border border-rose-100">
            <h2 className="text-xl font-black text-rose-600 mb-4">出错了</h2>
            <p className="text-slate-600 text-sm mb-4">
              {this.state.errorInfo?.error || '发生了未知错误。'}
            </p>
            {this.state.errorInfo?.operationType && (
              <div className="bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-500 mb-4 break-all">
                <p><strong>Operation:</strong> {this.state.errorInfo.operationType}</p>
                <p><strong>Path:</strong> {this.state.errorInfo.path}</p>
              </div>
            )}
            <button
              className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl hover:bg-rose-600 transition"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
