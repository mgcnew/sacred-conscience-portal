import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionError } from "./SectionError";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionTitle?: string;
  sectionIcon?: ReactNode;
  fallback?: ReactNode;
  hideHeader?: boolean;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for dashboard sections
 * Requirements: 5.4 - Ensures error in one section doesn't break others
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Section error:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full">
          {this.props.sectionTitle && !this.props.hideHeader && (
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                {this.props.sectionIcon}
                {this.props.sectionTitle}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <SectionError
              message="Ocorreu um erro inesperado nesta seção"
              onRetry={this.handleRetry}
            />
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
