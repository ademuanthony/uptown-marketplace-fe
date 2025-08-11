'use client';

import { HeroIcon } from '@/types';

export interface Tab {
  id: string;
  name: string;
  icon: HeroIcon;
  count?: number;
}

interface ProfileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon
                className={`
                  -ml-0.5 mr-2 h-5 w-5 transition-colors
                  ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
              />
              <span>{tab.name}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs font-medium transition-colors
                    ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-900'}
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
