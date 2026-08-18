import React from 'react';

interface Props {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PurgeModal: React.FC<Props> = ({ count, onCancel, onConfirm }) => (
  <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
    <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-in">
      <h3 className="text-red-400 font-bold text-lg mb-2 flex items-center gap-2">
        <span className="text-xl">⚠️</span> Confirm Purge
      </h3>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        Are you sure you want to permanently delete{' '}
        <strong className="text-red-400 font-bold">{count}</strong> flagged record(s)? This action
        cannot be undone and the telemetry data will be lost.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-900/20"
        >
          Purge Records
        </button>
      </div>
    </div>
  </div>
);
