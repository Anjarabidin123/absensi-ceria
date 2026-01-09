import { Suspense, ComponentType, ReactNode, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyComponent({ children, fallback }: LazyComponentProps) {
  const defaultFallback = (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) {
  const LazyComp = lazy(importFn);
  
  const LazyWrappedComponent = (props: P) => (
    <LazyComponent fallback={fallback}>
      <LazyComp {...props} />
    </LazyComponent>
  );

  return LazyWrappedComponent;
}
