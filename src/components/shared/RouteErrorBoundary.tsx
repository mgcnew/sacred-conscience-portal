import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const RELOAD_FLAG = 'chunk-reload-attempt';

/**
 * Um erro de chunk acontece quando o deploy trocou os arquivos e o
 * navegador ainda pede um chunk da versão anterior. Não é bug de código:
 * o conserto é recarregar para buscar o bundle novo.
 */
const isChunkLoadError = (error: Error): boolean =>
  /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported module/i
    .test(`${error.message} ${error.name}`);

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class RouteErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Erro na rota:', error, errorInfo);

    // Chunk desatualizado: recarrega uma única vez. A flag evita laço de
    // reload caso o problema persista depois da primeira tentativa.
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    }
  }

  componentDidUpdate(_: Props, prevState: State): void {
    if (prevState.error && !this.state.error) {
      sessionStorage.removeItem(RELOAD_FLAG);
    }
  }

  handleRetry = (): void => {
    sessionStorage.removeItem(RELOAD_FLAG);
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunk = isChunkLoadError(error);

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-warning-subtle flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-warning" />
          </div>

          <h1 className="font-display text-2xl font-medium text-foreground mb-2">
            {chunk ? 'Uma nova versão foi publicada' : 'Esta página não carregou'}
          </h1>

          <p className="text-muted-foreground font-body mb-6">
            {chunk
              ? 'Recarregue para continuar com a versão mais recente do portal.'
              : 'O restante do portal continua funcionando. Você pode tentar de novo ou voltar ao início.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={chunk ? () => window.location.reload() : this.handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {chunk ? 'Recarregar' : 'Tentar de novo'}
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
              <Home className="w-4 h-4 mr-2" />
              Ir para o início
            </Button>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-6 text-left text-xs text-muted-foreground bg-muted rounded-lg p-3 overflow-x-auto">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

/**
 * Isola uma rota: um erro aqui derruba só esta página, não o app inteiro.
 * A `key` do location faz o boundary reiniciar ao navegar, para que o
 * usuário não fique preso na tela de erro depois de trocar de página.
 */
export const RouteErrorBoundary: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  return <RouteErrorBoundaryInner key={location.pathname}>{children}</RouteErrorBoundaryInner>;
};

/** Fallback de carregamento das páginas lazy. */
export const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Suspense + ErrorBoundary numa peça só, para uso nas rotas. */
export const LazyRoute: React.FC<Props> = ({ children }) => (
  <RouteErrorBoundary>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </RouteErrorBoundary>
);

export default RouteErrorBoundary;
