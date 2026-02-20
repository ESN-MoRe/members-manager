import { ArrowRight, CheckCircle2, Move, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    const hidden = localStorage.getItem('hideWelcomeModal');
    if (!hidden) setIsOpen(true);
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeModal', 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-300 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              Benvenuto ✨
            </h2>
            <button
              type="button"
              title="Chiudi"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                Robe che puoi fare
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-3 items-center text-gray-700">
                  <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
                    <Move size={18} />
                  </div>
                  <span>Sposta i membri trascinandoli tra le sezioni</span>
                </li>
                <li className="flex gap-3 items-center text-gray-700">
                  <div className="bg-pink-100 p-1.5 rounded-md text-pink-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <span>
                    Clicca su un membro per <strong>modificarlo</strong> o{' '}
                    <strong>rimuoverlo</strong>
                  </span>
                </li>
                <li className="flex gap-3 items-center text-gray-700">
                  <div className="bg-orange-100 p-1.5 rounded-md text-orange-600">
                    <UserPlus size={18} />
                  </div>
                  <span>
                    Usa il tasto{' '}
                    <UserPlus className="inline-block mx-0.5 mb-1" size={18} />{' '}
                    per aggiungere nuovi membri
                  </span>
                </li>
              </ul>
            </section>

            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                Come salvare?
              </h3>
              <p className="text-sm text-gray-600">
                Premi il tasto <strong>"Continua"</strong> in alto a destra.{' '}
                <strong>Non invia le modifiche</strong> quindi non preoccuparti,
                non esplode
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <button
              type="button"
              title="Inizia"
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 cursor-pointer"
            >
              let's go⛷️ <ArrowRight size={18} />
            </button>

            <label className="flex items-center gap-2 cursor-pointer self-center">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">
                Non mostrare più questo messaggio
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
