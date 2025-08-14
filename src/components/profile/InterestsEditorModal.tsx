'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  TagIcon,
  HeartIcon,
  TrophyIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  FilmIcon,
  UserGroupIcon,
  PlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface InterestsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInterests: string[];
  onSave: (interests: string[]) => Promise<void>;
}

// Interest categories with icons and predefined interests
const INTEREST_CATEGORIES = {
  lifestyle: {
    name: 'Lifestyle',
    icon: HeartIcon,
    color: 'text-purple-600 border-purple-200 bg-purple-50',
    selectedColor: 'bg-purple-600 text-white border-purple-600',
    interests: [
      'yoga',
      'meditation',
      'wellness',
      'mindfulness',
      'spirituality',
      'self-care',
      'health',
      'fitness',
      'nutrition',
      'pilates',
    ],
  },
  sports: {
    name: 'Sports & Fitness',
    icon: TrophyIcon,
    color: 'text-green-600 border-green-200 bg-green-50',
    selectedColor: 'bg-green-600 text-white border-green-600',
    interests: [
      'gym',
      'running',
      'hiking',
      'cycling',
      'swimming',
      'football',
      'basketball',
      'tennis',
      'soccer',
      'workout',
      'crossfit',
      'marathon',
      'climbing',
      'surfing',
      'skiing',
      'golf',
      'boxing',
      'martial arts',
    ],
  },
  music: {
    name: 'Music & Arts',
    icon: MusicalNoteIcon,
    color: 'text-pink-600 border-pink-200 bg-pink-50',
    selectedColor: 'bg-pink-600 text-white border-pink-600',
    interests: [
      'music',
      'concerts',
      'art',
      'painting',
      'dancing',
      'singing',
      'guitar',
      'piano',
      'jazz',
      'rock',
      'classical',
      'hip-hop',
      'electronic',
      'festivals',
      'photography',
      'design',
      'drawing',
    ],
  },
  food: {
    name: 'Food & Dining',
    icon: TagIcon,
    color: 'text-orange-600 border-orange-200 bg-orange-50',
    selectedColor: 'bg-orange-600 text-white border-orange-600',
    interests: [
      'cooking',
      'restaurants',
      'wine',
      'coffee',
      'baking',
      'foodie',
      'cuisine',
      'dining',
      'craft beer',
      'cocktails',
      'barbecue',
      'vegan',
      'vegetarian',
      'sushi',
      'pizza',
      'chocolate',
    ],
  },
  travel: {
    name: 'Travel',
    icon: GlobeAltIcon,
    color: 'text-blue-600 border-blue-200 bg-blue-50',
    selectedColor: 'bg-blue-600 text-white border-blue-600',
    interests: [
      'travel',
      'adventure',
      'backpacking',
      'exploration',
      'wanderlust',
      'culture',
      'nature',
      'camping',
      'road trips',
      'beaches',
      'mountains',
      'cities',
      'museums',
      'history',
    ],
  },
  technology: {
    name: 'Technology',
    icon: ComputerDesktopIcon,
    color: 'text-cyan-600 border-cyan-200 bg-cyan-50',
    selectedColor: 'bg-cyan-600 text-white border-cyan-600',
    interests: [
      'technology',
      'startups',
      'ai',
      'gaming',
      'coding',
      'programming',
      'blockchain',
      'cryptocurrency',
      'innovation',
      'gadgets',
      'software',
      'apps',
      'tech',
      'web3',
      'robotics',
    ],
  },
  entertainment: {
    name: 'Entertainment',
    icon: FilmIcon,
    color: 'text-yellow-600 border-yellow-200 bg-yellow-50',
    selectedColor: 'bg-yellow-600 text-white border-yellow-600',
    interests: [
      'movies',
      'books',
      'shows',
      'netflix',
      'reading',
      'cinema',
      'tv series',
      'podcasts',
      'anime',
      'comedy',
      'theater',
      'streaming',
      'documentaries',
      'horror',
      'sci-fi',
    ],
  },
  social: {
    name: 'Social & Community',
    icon: UserGroupIcon,
    color: 'text-red-600 border-red-200 bg-red-50',
    selectedColor: 'bg-red-600 text-white border-red-600',
    interests: [
      'volunteering',
      'networking',
      'community',
      'charity',
      'social impact',
      'activism',
      'mentoring',
      'leadership',
      'teamwork',
      'public speaking',
      'politics',
      'environment',
    ],
  },
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function InterestsEditorModal({
  isOpen,
  onClose,
  currentInterests,
  onSave,
}: InterestsEditorModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentInterests);
  const [customInterest, setCustomInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Reset selected interests when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedInterests(currentInterests);
      setCustomInterest('');
      setAutocompleteQuery('');
      setShowAutocomplete(false);
    }
  }, [isOpen, currentInterests]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get all available interests from all categories
  const getAllInterests = () => {
    const allInterests: string[] = [];
    Object.values(INTEREST_CATEGORIES).forEach(category => {
      allInterests.push(...category.interests);
    });
    return [...new Set(allInterests)]; // Remove duplicates
  };

  // Filter interests based on query and exclude already selected ones
  const getFilteredAutocompleteInterests = (query: string) => {
    if (!query.trim()) return [];

    const allInterests = getAllInterests();
    const queryLower = query.toLowerCase().trim();

    const filtered = allInterests.filter(interest => {
      const interestLower = interest.toLowerCase();
      const matchesQuery = interestLower.includes(queryLower);
      const notSelected = !selectedInterests.some(
        selected => selected.toLowerCase() === interestLower,
      );
      return matchesQuery && notSelected;
    });

    // Sort by relevance (exact match first, then starts with, then contains)
    return filtered
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        if (aLower === queryLower) return -1;
        if (bLower === queryLower) return 1;
        if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
        if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8); // Limit to 8 suggestions
  };

  const toggleInterest = (interest: string) => {
    const lowerInterest = interest.toLowerCase();

    if (selectedInterests.some(i => i.toLowerCase() === lowerInterest)) {
      setSelectedInterests(prev => prev.filter(i => i.toLowerCase() !== lowerInterest));
    } else if (selectedInterests.length < 8) {
      setSelectedInterests(prev => [...prev, interest]);
    } else {
      toast.error('You can only select up to 8 interests');
    }
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;

    if (trimmed.length > 50) {
      toast.error('Interest must be 50 characters or less');
      return;
    }

    const lowerTrimmed = trimmed.toLowerCase();
    if (selectedInterests.some(i => i.toLowerCase() === lowerTrimmed)) {
      toast.error('This interest is already selected');
      return;
    }

    if (selectedInterests.length >= 8) {
      toast.error('You can only select up to 8 interests');
      return;
    }

    setSelectedInterests(prev => [...prev, trimmed]);
    setCustomInterest('');
    toast.success('Custom interest added!');
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedInterests);
      toast.success('Interests updated successfully!');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update interests';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Remove the filtering for category display - categories should always show all interests
  const getCategoryInterests = (categoryInterests: string[]) => {
    return categoryInterests;
  };

  const isInterestSelected = (interest: string) => {
    return selectedInterests.some(i => i.toLowerCase() === interest.toLowerCase());
  };

  const categories = Object.entries(INTEREST_CATEGORIES);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Edit Your Interests
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 mt-1">
                      Select up to 8 interests that represent you ({selectedInterests.length}/8)
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Selected Interests */}
                {selectedInterests.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInterests.map((interest, index) => (
                        <span
                          key={`selected-${interest}-${index}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 border border-primary-200"
                        >
                          {interest}
                          <button
                            onClick={() => toggleInterest(interest)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-200 hover:bg-primary-300"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search with Autocomplete */}
                <div className="relative mb-6" ref={autocompleteRef}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={autocompleteQuery}
                    onChange={e => {
                      const value = e.target.value;
                      setAutocompleteQuery(value);
                      setShowAutocomplete(value.trim().length > 0);
                    }}
                    onFocus={() => {
                      if (autocompleteQuery.trim().length > 0) {
                        setShowAutocomplete(true);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setShowAutocomplete(false);
                      }
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Search interests..."
                  />

                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && (
                    <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white border-2 border-primary-200 rounded-lg shadow-2xl ring-2 ring-primary-100 ring-opacity-50 max-h-60 overflow-y-auto">
                      {(() => {
                        const suggestions = getFilteredAutocompleteInterests(autocompleteQuery);

                        if (suggestions.length === 0) {
                          return (
                            <div className="px-4 py-4 text-sm">
                              <div className="text-gray-600 font-medium mb-2">
                                No matching interests found
                              </div>
                              {autocompleteQuery.trim() && selectedInterests.length < 8 && (
                                <button
                                  onClick={() => {
                                    const trimmed = autocompleteQuery.trim();
                                    if (trimmed && trimmed.length <= 50) {
                                      toggleInterest(trimmed);
                                      setAutocompleteQuery('');
                                      setShowAutocomplete(false);
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 hover:text-primary-800 font-medium rounded-md transition-colors duration-150 border border-primary-200"
                                >
                                  <PlusIcon className="h-4 w-4 inline mr-2" />
                                  Add &quot;{autocompleteQuery.trim()}&quot; as custom interest
                                </button>
                              )}
                            </div>
                          );
                        }

                        return suggestions.map(interest => (
                          <button
                            key={interest}
                            onClick={() => {
                              toggleInterest(interest);
                              setAutocompleteQuery('');
                              setShowAutocomplete(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-primary-50 hover:text-primary-900 focus:outline-none focus:bg-primary-50 focus:text-primary-900 flex items-center justify-between group transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                          >
                            <span className="capitalize font-medium">{interest}</span>
                            <PlusIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors duration-150" />
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Custom Interest */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">Add Custom Interest</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customInterest}
                      onChange={e => setCustomInterest(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addCustomInterest()}
                      maxLength={50}
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your custom interest..."
                    />
                    <button
                      onClick={addCustomInterest}
                      disabled={!customInterest.trim() || selectedInterests.length >= 8}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Can&apos;t find what you&apos;re looking for? Create your own!
                  </p>
                </div>

                {/* Categories */}
                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6 overflow-x-auto">
                    {categories.map(([key, category]) => {
                      const IconComponent = category.icon;
                      return (
                        <Tab
                          key={key}
                          className={({ selected }) =>
                            classNames(
                              'w-full rounded-lg py-2.5 px-3 text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center space-x-2',
                              'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                              selected
                                ? 'bg-white text-primary-700 shadow'
                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800',
                            )
                          }
                        >
                          <IconComponent className="h-4 w-4" />
                          <span className="hidden sm:inline">{category.name}</span>
                        </Tab>
                      );
                    })}
                  </Tab.List>

                  <Tab.Panels className="max-h-96 overflow-y-auto">
                    {categories.map(([key, category]) => {
                      const categoryInterests = getCategoryInterests(category.interests);

                      return (
                        <Tab.Panel key={key} className="rounded-xl bg-white p-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {categoryInterests.map(interest => {
                              const selected = isInterestSelected(interest);
                              return (
                                <button
                                  key={interest}
                                  onClick={() => toggleInterest(interest)}
                                  className={classNames(
                                    'px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-200',
                                    selected
                                      ? category.selectedColor
                                      : `${category.color} hover:shadow-md`,
                                  )}
                                >
                                  {interest.charAt(0).toUpperCase() + interest.slice(1)}
                                </button>
                              );
                            })}
                          </div>
                        </Tab.Panel>
                      );
                    })}
                  </Tab.Panels>
                </Tab.Group>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || selectedInterests.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Interests'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
