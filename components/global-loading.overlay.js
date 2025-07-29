'use client';

import { useState, useEffect } from 'react';

const GlobalLoadingOverlay = ({ isLoading }) => {

  useEffect(() => {
    if (isLoading) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    };
}, [isLoading]);

  return (
    <>
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[9999] backdrop-blur-md">
          <div className="text-white text-lg mb-5">Cargando...</div>
          <div className="w-10 h-10 border-4 border-t-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    </>
  );
};

export default GlobalLoadingOverlay;