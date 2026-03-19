import React from 'react';
import { Star } from 'lucide-react';

const RatingDisplay = ({ rating, totalReviews, size = 'md', showCount = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textSizeClasses[size] || textSizeClasses.md;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Star className={`${iconSize} text-yellow-500 fill-yellow-500`} />
      <span className={`${textSize} font-medium text-gray-900 dark:text-white`}>
        {rating?.toFixed(1) || '0.0'}
      </span>
      {showCount && totalReviews !== undefined && (
        <span className={`${textSize} text-gray-500 dark:text-gray-400`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
