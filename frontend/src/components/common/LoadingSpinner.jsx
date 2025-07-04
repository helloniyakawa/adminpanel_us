import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600" style={{borderBottomColor: 'var(--primary-600)'}}></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 