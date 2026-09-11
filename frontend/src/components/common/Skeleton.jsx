import React from 'react';

export const Skeleton = ({ className = '', rounded = 'rounded-xl', ...props }) => {
  return (
    <div
      className={`skeleton-shimmer bg-slate-100 ${rounded} ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`p-6 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
};

export const SkeletonRow = ({ columns = 5, className = '' }) => {
  return (
    <tr className={`divide-x divide-slate-50 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className={`h-4 ${i === 0 ? 'w-24' : i === columns - 1 ? 'w-16 ml-auto' : 'w-32'}`} />
        </td>
      ))}
    </tr>
  );
};

export const SkeletonChatBubble = ({ isAi = true }) => {
  return (
    <div className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}>
      {isAi && <Skeleton className="w-8 h-8 rounded-xl shrink-0" />}
      <div className={`space-y-2 max-w-md ${isAi ? 'items-start' : 'items-end'}`}>
        <Skeleton className={`h-16 ${isAi ? 'w-72' : 'w-60'} rounded-2xl`} />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

export default Skeleton;
