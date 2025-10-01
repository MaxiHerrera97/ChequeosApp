import React from 'react';

const Pagination = ({ currentPage, totalPages, onNext, onPrevious }) => {
  return (
    <div className="flex items-center gap-2 mt-6">
      <button 
        type="button"
        onClick={onPrevious}
        aria-label="Página anterior"
        className={`flex items-center justify-center px-3 h-9 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={currentPage === 1}
      >
        <svg className="w-3.5 h-3.5 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5H1m0 0 4 4M1 5l4-4"/>
        </svg>
        Anterior
      </button>
      <button 
        type="button"
        onClick={onNext}
        aria-label="Página siguiente"
        className={`flex items-center justify-center px-3 h-9 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={currentPage === totalPages}
      >
        Siguiente
        <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
        </svg>
      </button>
    </div>
  );
};

export default Pagination;