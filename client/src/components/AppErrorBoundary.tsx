import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || '页面渲染失败',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoChat = (): void => {
    window.location.href = '/chat';
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-[72px] h-[72px] rounded-full bg-danger-50 text-danger-500 flex items-center justify-center text-[32px] mx-auto">
              !
            </div>
            <h2 className="mt-4 text-elder-lg font-bold text-[#212121]">
              页面暂时出了点问题
            </h2>
            <p className="mt-2 text-[15px] text-gray-500 leading-6">
              已拦截这次错误，避免整页空白。您可以先返回对话，或重新加载页面。
            </p>
            {this.state.errorMessage && (
              <p className="mt-3 text-[13px] text-gray-400 break-words">
                {this.state.errorMessage}
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={this.handleGoChat}
                className="h-[46px] rounded-2xl bg-primary-50 text-primary-500 text-[15px] font-medium"
              >
                返回对话
              </button>
              <button
                onClick={this.handleReload}
                className="h-[46px] rounded-2xl bg-primary-500 text-white text-[15px] font-medium"
              >
                重新加载
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
