import { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function SettingsCard({
  title,
  description,
  children,
  icon,
  className = '',
}: SettingsCardProps) {
  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        {icon && <div className="mr-3 text-gray-600">{icon}</div>}
        <div>
          <h3 className="text-md font-medium text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
