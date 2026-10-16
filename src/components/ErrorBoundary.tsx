import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled render error:", error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public handleGoChat = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/chat";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">
                {this.props.fallbackTitle || "Күтпеген қате орын алды"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {this.props.fallbackDescription ||
                  "Бетті жүктеу кезінде ақау шықты. Төмендегі түймені басып, бетті қайта жүктеп көріңіз."}
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-xl bg-secondary/50 p-3 text-left">
                <p className="text-[11px] font-mono text-muted-foreground break-all line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={this.handleReload}
                className="flex-1 rounded-xl gradient-medical text-primary-foreground shadow-sm gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Қайта жүктеу
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoChat}
                className="flex-1 rounded-xl border-border/80 gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Чатқа қайту
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
