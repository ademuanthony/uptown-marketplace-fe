import React, { useState } from 'react';
import { ConversationType } from '@/services/messaging';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (type: ConversationType, title?: string, participantIds?: string[]) => Promise<void>;
}

const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [conversationType, setConversationType] = useState<ConversationType>('direct');
  const [title, setTitle] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      
      // For now, we'll use email as participant ID
      // In a real implementation, you'd lookup user by email first
      const participantIds = participantEmail ? [participantEmail] : [];
      
      await onCreate(conversationType, title || undefined, participantIds);
      
      // Reset form
      setTitle('');
      setParticipantEmail('');
      onClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Start New Conversation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conversation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Type
            </label>
            <select
              value={conversationType}
              onChange={e => setConversationType(e.target.value as ConversationType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="direct">Direct Message</option>
              <option value="group">Group Chat</option>
              <option value="support">Support Chat</option>
            </select>
          </div>

          {/* Title (for group chats) */}
          {conversationType === 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter group name..."
              />
            </div>
          )}

          {/* Participant */}
          {conversationType !== 'support' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {conversationType === 'direct' ? 'Recipient Email' : 'Participant Email'}
              </label>
              <input
                type="email"
                value={participantEmail}
                onChange={e => setParticipantEmail(e.target.value)}
                required={conversationType === 'direct'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address..."
              />
            </div>
          )}

          {/* Note about implementation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> This is a basic implementation. In production, you would select users from a directory rather than entering emails.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConversationModal;