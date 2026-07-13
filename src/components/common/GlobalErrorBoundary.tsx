import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // ChunkLoadError 감지 시 (새로운 배포가 발생하여 옛날 청크 파일을 찾을 수 없을 때)
    const isChunkLoadError = error.name === 'ChunkLoadError' || 
                             error.message.includes('dynamically imported module') ||
                             error.message.includes('Failed to fetch dynamically imported module');
                             
    if (isChunkLoadError) {
      // 무한 새로고침 방지를 위해 sessionStorage 사용
      const hasReloaded = sessionStorage.getItem('chunk_error_reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_error_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">화면을 불러오는데 문제가 발생했습니다</h2>
          <p className="text-gray-500 mb-6">앱이 최신 버전으로 업데이트되었을 수 있습니다.</p>
          <button
            onClick={() => {
              sessionStorage.removeItem('chunk_error_reloaded');
              window.location.reload();
            }}
            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium shadow-md hover:bg-rose-600 active:scale-95 transition-all"
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
