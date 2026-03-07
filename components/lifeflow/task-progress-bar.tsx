'use client';

interface TaskProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TaskProgressBar = ({
  completed,
  total,
  showLabel = true,
  size = 'sm',
}: TaskProgressBarProps) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className="w-full">
      <div className={`w-full ${heightClass} bg-white/10 rounded-full overflow-hidden`}>
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-white/60 mt-1">
          {completed}/{total} subtasks
        </p>
      )}
    </div>
  );
};
