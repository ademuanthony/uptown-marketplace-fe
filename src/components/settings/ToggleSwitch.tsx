interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ToggleSwitch({ 
  enabled, 
  onToggle, 
  disabled = false, 
  size = 'md' 
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: 'h-4 w-8',
    md: 'h-6 w-11',
    lg: 'h-8 w-14'
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const translateClasses = {
    sm: enabled ? 'translate-x-4' : 'translate-x-0.5',
    md: enabled ? 'translate-x-6' : 'translate-x-1',
    lg: enabled ? 'translate-x-8' : 'translate-x-1'
  };

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex ${sizeClasses[size]} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        enabled ? 'bg-primary-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`${thumbSizeClasses[size]} inline-block transform rounded-full bg-white transition-transform ${translateClasses[size]}`}
      />
    </button>
  );
}