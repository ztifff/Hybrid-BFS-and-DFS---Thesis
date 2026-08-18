import React from 'react';

interface Props {
  count: number;
  scenario: string;
  onClose: () => void;
}

export const ImportSuccessModal: React.FC<Props> = ({ count, scenario, onClose }) => (
  <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn p-4">
    <div className="bg-[#0d1117] border border-emerald-500/40 rounded-2xl w-full max-w-md shadow-2xl shadow-emerald-900/30 overflow-hidden scale-in">
      <div className="bg-gradient-to-r from-emerald-900/80 via-green-800/60 to-emerald-900/80 px-6 py-4 border-b border-emerald-500/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xl shrink-0">
          ✅
        </div>
        <div>
          <h3 className="text-emerald-300 font-bold text-base tracking-wide">Import Successful</h3>
          <p className="text-emerald-400/70 text-xs mt-0.5">Records have been added to history</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <p className="text-gray-300 text-sm leading-relaxed">
          Successfully imported simulation records into the{' '}
          <strong className="text-emerald-400">
            {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
          </strong>{' '}
          scenario history.
        </p>

        <div className="flex items-center gap-4 bg-black/40 rounded-xl p-4 border border-white/5">
          <div className="flex-1 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Records Imported</div>
            <span className="text-3xl font-black text-emerald-400">{count}</span>
          </div>
          <div className="w-px h-10 bg-white/10 shrink-0" />
          <div className="flex-1 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Scenario</div>
            <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              {scenario}
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed">
          💡 Your imported records are now visible in the history list and are ready for review.
        </p>
      </div>

      <div className="px-6 pb-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  </div>
);
