import { ReactNode } from 'react';

interface SettingsItemProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function SettingsItem({ 
  title, 
  description, 
  children, 
  icon, 
  className = '', 
}: SettingsItemProps) {
  return (
    <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center">
        {icon && <div className="mr-3 text-gray-600">{icon}</div>}
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          {description && (
            <div className="text-sm text-gray-600">{description}</div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}