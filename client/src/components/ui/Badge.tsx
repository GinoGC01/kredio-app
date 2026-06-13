interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'default';
  children: string;
}

const styles: Record<string, string> = {
  success: 'bg-stat-teal-bg text-success',
  warning: 'bg-stat-blue-bg text-warning',
  danger: 'bg-stat-red-bg text-danger',
  info: 'bg-stat-purple-bg text-accent-purple',
  default: 'bg-bg-input text-text-muted',
};

export const Badge = ({ variant, children }: BadgeProps) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
};
