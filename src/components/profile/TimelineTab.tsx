'use client';

import Image from 'next/image';
import { DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import { TimelinePost } from '@/services/publicProfile';

interface TimelineTabProps {
  userId?: string; // Made optional since it's not currently used
  timelinePosts: TimelinePost[];
}

export function TimelineTab({ timelinePosts }: TimelineTabProps) {
  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (timelinePosts.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No timeline posts</h3>
        <p className="mt-1 text-sm text-gray-500">
          This user hasn&apos;t shared anything on their timeline yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {timelinePosts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow p-6">
          {/* Post Header */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formatPostDate(post.created_at)}</span>
          </div>

          {/* Post Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Image */}
          {post.image_url && (
            <div className="mt-4">
              <div className="relative w-full max-w-lg mx-auto">
                <Image
                  src={getAbsoluteImageUrl(post.image_url)}
                  alt="Timeline post image"
                  width={500}
                  height={300}
                  className="rounded-lg object-cover w-full"
                />
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                {/* Future: Add like, comment, share buttons */}
                <span>Timeline post</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}