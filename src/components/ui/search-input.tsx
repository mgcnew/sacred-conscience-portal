import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = 'Buscar...', containerClassName, className, ...props }, ref) => {
    const handleClear = () => {
      onChange('');
      onClear?.();
    };

    return (
      <div className={cn(
        'flex items-center gap-2 h-12 md:h-10 px-3 rounded-lg border border-input bg-input',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow',
        containerClassName,
      )}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent outline-none min-w-0',
            'text-base md:text-sm text-foreground placeholder:text-muted-foreground',
            className,
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
