import { cn } from '@/lib/utils';

interface OrganicDividerProps {
  className?: string;
  variant?: 'leaf' | 'dots';
}

const LeafSVG = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-primary/60 shrink-0">
    <path
      d="M10 2C10 2 4 5 4 11C4 14.314 6.686 17 10 17C13.314 17 16 14.314 16 11C16 5 10 2 10 2Z"
      fill="currentColor"
      opacity="0.35"
    />
    <path
      d="M10 2C10 2 4 5 4 11C4 14.314 6.686 17 10 17"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M10 17L10 9"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M10 12L13 9"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M10 14L7 11"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

export const OrganicDivider: React.FC<OrganicDividerProps> = ({
  className,
  variant = 'leaf',
}) => {
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-2 my-4', className)}>
        <div className="h-px flex-1 bg-border" />
        <div className="flex gap-1.5">
          <span className="w-1 h-1 rounded-full bg-primary/30" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          <span className="w-1 h-1 rounded-full bg-primary/30" />
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center gap-3 my-4', className)}>
      <div className="h-px flex-1 bg-border" />
      <LeafSVG />
      <div className="h-px flex-1 bg-border" />
    </div>
  );
};

export default OrganicDivider;
