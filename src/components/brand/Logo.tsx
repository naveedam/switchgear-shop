import React from 'react';
import { cn } from '@/lib/utils';

/** The mark: a miniature circuit breaker, handle switched ON. */
export const LogoMark: React.FC<{ className?: string; inverted?: boolean }> = ({ className, inverted }) => (
  <svg viewBox="0 0 64 64" className={cn('h-8 w-8 shrink-0', className)} aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="14" fill={inverted ? '#FFFFFF' : '#172138'} />
    <rect x="18" y="7" width="28" height="50" rx="5" fill={inverted ? '#172138' : '#FFFFFF'} />
    <rect x="25" y="13" width="14" height="24" rx="3" fill={inverted ? '#FFFFFF' : '#172138'} />
    <rect x="27" y="15" width="10" height="11" rx="2" fill="#E8A317" />
    <circle cx="26" cy="47" r="3.2" fill={inverted ? '#FFFFFF' : '#172138'} />
    <circle cx="38" cy="47" r="3.2" fill={inverted ? '#FFFFFF' : '#172138'} />
  </svg>
);

/** Mark + wordmark. `inverted` for dark backgrounds (footer). */
const Logo: React.FC<{ className?: string; inverted?: boolean }> = ({ className, inverted }) => (
  <span className={cn('inline-flex items-center gap-2', className)}>
    <LogoMark inverted={inverted} />
    <span className="font-display text-xl font-bold tracking-tight leading-none">
      SwitchgearShop<span className={inverted ? 'text-primary-foreground/60' : 'text-muted-foreground'}>.in</span>
    </span>
  </span>
);

export default Logo;
