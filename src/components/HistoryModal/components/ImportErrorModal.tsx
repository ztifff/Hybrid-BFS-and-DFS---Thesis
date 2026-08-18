import React from 'react';

interface Props {
  expected: string;
  found: string;
  onClose: () => void;
}

export const ImportErrorModal: React.FC<Props> = ({ expected, found, onClose }) => (
  <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn p-4">
    <div className="bg-[#0d1117] border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl shadow-red-900/30 overflow-hidden scale-in">
      <div className="bg-gradient-to-r from-red-900/80 via-rose-800/60 to-red-900/80 px-6 py-4 border-b border-red-500/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-xl shrink-0">
          🚫
        </div>
        <div>
          <h3 className="text-red-300 font-bold text-base tracking-wide">Invalid Scenario Results</h3>
          <p className="text-red-400/70 text-xs mt-0.5">Scenario mismatch detected in import file</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <p className="text-gray-300 text-sm leading-relaxed">
          The file you selected contains results from a{' '}
          <strong className="text-red-400">different scenario</strong> and cannot be imported here.
        </p>

        <div className="flex items-center gap-3 bg-black/40 rounded-xl p-4 border border-white/5">
          <div className="flex-1 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Current Scenario</div>
            <span className="inline-block px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
              {expected}
            </span>
          </div>
          <div className="text-gray-600 text-lg font-bold shrink-0">≠</div>
          <div className="flex-1 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">File Contains</div>
            <span className="inline-block px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
              {found}
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed">
          💡 To import these results, navigate to the{' '}
          <strong className="text-gray-400">{found.charAt(0).toUpperCase() + found.slice(1)}</strong> scenario
          and try importing there.
        </p>
      </div>

      <div className="px-6 pb-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/30 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);
