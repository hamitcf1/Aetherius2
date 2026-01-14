import React from 'react';

const EmpoweredBadge: React.FC<{ small?: boolean }> = ({ small = false }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${small ? 'text-[10px] px-2' : 'text-xs' } bg-indigo-600 text-white`}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
      <path d="M12 2L13.09 8.26L19 9.27L14.5 13.14L15.36 19.02L12 16.77L8.64 19.02L9.5 13.14L5 9.27L10.91 8.26L12 2Z" fill="white" />
    </svg>
    <span>{small ? 'Emp' : 'Empowered'}</span>
  </span>
);

export default EmpoweredBadge;
