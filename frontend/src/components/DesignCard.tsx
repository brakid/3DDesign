import { Link } from 'react-router-dom';
import type { Design } from '../types';
import { getThumbnailUrl, getCoverUrl } from '../lib/api';

interface DesignCardProps {
  design: Design;
}

export function DesignCard({ design }: DesignCardProps) {
  const imageUrl = getCoverUrl(design.coverImage) || getThumbnailUrl(design.thumbnail);

  return (
    <Link
      to={`/design/${design.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={design.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{design.name}</h3>
        
        {design.category && (
          <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
            {design.category}
          </span>
        )}
        
        {design.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {design.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {design.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{design.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
