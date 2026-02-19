import { AlertTriangle, ArrowRight, RefreshCw, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DiffViewer from './components/DiffViewer';
import ImageSyncManager from './components/ImageSyncManager';
import MemberModal from './components/MemberModal';
import WelcomeModal from './components/WelcomeModal';
import { SECTION_COLORS, SECTION_KEYS } from './constants';
import SectionColumn from './SectionColumn';
import type { MemberData, SectionsState, SectionType } from './types';
import { parseDrupalHtml } from './utils';

// New Interface for Preview Data
interface PreviewData {
  oldHtml: string;
  newHtml: string;
  images: {
    toUpload: string[];
    toDelete: string[];
  };
}

export default function App() {
  const [sections, setSections] = useState<SectionsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null); // New State

  // Modal state
  const [editModal, setEditModal] = useState<{
    section: SectionType;
    index: number | null;
  } | null>(null);

  // Drag state
  const dragSource = useRef<{ section: SectionType; index: number } | null>(
    null,
  );

  // Log container ref for auto-scroll
  const logBodyRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: necessary to auto-scroll on new logs
  useEffect(() => {
    // Scroll log container to bottom when logs change
    if (logBodyRef.current) {
      logBodyRef.current.scrollTop = logBodyRef.current.scrollHeight;
    }
  }, [logs]);

  const startStreaming = () => {
    setLoading(true);
    setIsStreaming(true);
    setLogs([]);

    const eventSource = new EventSource(`/v1/drupal/stream-about-us`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'log') {
        setLogs((prev) => [...prev, data.message]);
      } else if (data.type === 'result') {
        const jsonState = parseDrupalHtml(data.content);
        setSections(jsonState);
        setLoading(false);
        setIsStreaming(false);
        eventSource.close();
      } else if (data.type === 'error') {
        setError(data.message);
        setIsStreaming(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError('Connection to stream lost.');
      setIsStreaming(false);
      eventSource.close();
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run only on mount
  useEffect(() => {
    startStreaming();
  }, []);

  async function handleSave() {
    if (!sections) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/v1/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sections),
      });
      if (!res.ok) throw new Error();
      setSaveMsg('✅ HTML aggiornato!');
    } catch {
      setSaveMsg('❌ Errore nel salvataggio.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  const handleReset = () => {
    if (
      window.confirm('Sei sicuro? Perderai tutte le modifiche non salvate.')
    ) {
      startStreaming();
    }
  };

  // Modified function to switch to Preview Mode
  const handleGoToPreview = async () => {
    if (!sections) return;
    setLoading(true);
    try {
      const res = await fetch(`/v1/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sections),
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      setPreviewData(data); // Save the full response including Diff and Images
      setView('preview');
    } catch (e) {
      console.error('Error generating preview:', e);
      alert("Errore nella generazione dell'anteprima");
    } finally {
      setLoading(false);
    }
  };

  function handleDragStart(section: SectionType, index: number) {
    dragSource.current = { section, index };
  }

  function handleDropOnCard(targetSection: SectionType, targetIndex: number) {
    const src = dragSource.current;
    if (!src || !sections) return;
    const next = { ...sections };
    // Remove from source
    const [moved] = next[src.section].splice(src.index, 1);
    // Insert into target
    next[targetSection].splice(targetIndex, 0, moved);
    setSections(next);
    dragSource.current = null;
  }

  function handleDropOnSection(targetSection: SectionType) {
    const src = dragSource.current;
    if (!src || !sections) return;
    const next = { ...sections };
    const [moved] = next[src.section].splice(src.index, 1);
    next[targetSection].push(moved);
    setSections({ ...next });
    dragSource.current = null;
  }

  function handleEditSave(
    section: SectionType,
    index: number | null,
    updated: MemberData,
  ) {
    if (!sections) return;
    const next = { ...sections };
    if (index === null) {
      next[section] = [...next[section], updated];
    } else {
      next[section] = next[section].map((m, i) => (i === index ? updated : m));
    }
    setSections(next);
    setEditModal(null);
  }

  function handleDelete(section: SectionType, index: number) {
    if (!sections) return;
    const next = { ...sections };
    next[section] = next[section].filter((_, i) => i !== index);
    setSections(next);
    setEditModal(null);
  }

  if (error)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-3">
            <AlertTriangle size={40} />
          </div>
          <div className="font-semibold">{error}</div>
          <div className="text-gray-500 mt-2 text-sm">
            Assicurati che il server Express sia in esecuzione.
          </div>
        </div>
      </div>
    );

  const modalSection = editModal?.section;
  const modalIndex = editModal?.index ?? null;
  const modalMember =
    modalSection && modalIndex !== null
      ? sections?.[modalSection][modalIndex]
      : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <WelcomeModal />
      {/* Floating Loading Indicator */}
      {loading && (
        <div className="fixed bottom-5 right-5 bg-white rounded-xl px-5 py-4 flex flex-col items-center shadow-lg z-150">
          <div className="w-9 h-9 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="mt-2 text-xs text-blue-500">Caricamento...</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img
            src="https://more.esn.it/sites/esnmodena.it/files/web-it-mode-esn-colour-black.png"
            alt="ESN Logo"
            className="h-10 mr-2.5"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm text-gray-900 leading-none">
              Manager membri
            </span>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${view === 'edit' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} cursor-pointer`}
                onClick={() => setView('edit')}
              >
                1. Modifica
              </button>
              <div className="w-4 h-px bg-gray-300" />
              <button
                type="button"
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${view === 'preview' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} cursor-pointer`}
                onClick={() => setView('preview')}
              >
                2. Anteprima
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {view === 'preview' && (
            <button
              type="button"
              onClick={() => setView('edit')}
              className="text-gray-500 hover:text-gray-700 font-semibold text-sm px-3 cursor-pointer"
            >
              Torna indietro
            </button>
          )}

          {view === 'edit' && (
            <>
              <button
                type="button"
                onClick={handleReset}
                disabled={isStreaming || loading}
                className="text-red-500 scale-90 hover:bg-red-50 border border-transparent rounded-lg px-3.5 py-2 flex items-center gap-2 font-semibold text-sm cursor-pointer transition-colors"
              >
                <RotateCcw size={16} /> Reset
              </button>

              <button
                type="button"
                onClick={startStreaming}
                disabled={isStreaming}
                className="bg-gray-100 text-gray-700 border border-gray-300 rounded-lg px-3.5 py-2 flex items-center gap-2 font-semibold text-sm cursor-pointer"
              >
                {isStreaming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                    Syncando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} /> Synca
                  </>
                )}
              </button>
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 rounded-lg px-6 py-2 font-bold text-sm cursor-pointer transition-colors"
                onClick={handleGoToPreview} // UPDATED
              >
                Continua <ArrowRight size={18} />
              </button>
            </>
          )}

          {view === 'preview' && (
            <button
              type="button"
              className={`bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 rounded-lg px-6 py-2 font-bold text-sm cursor-pointer transition-colors ${saving ? 'opacity-70' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvataggio...' : 'Conferma e pubblica'}
            </button>
          )}
        </div>
      </header>

      {view === 'edit' ? (
        <>
          {/* Log container */}
          <div className="mx-5 mt-5 mb-0 bg-white rounded-lg overflow-hidden text-gray-900 font-mono text-xs shadow-lg">
            <div className="px-3 py-2 bg-gray-100 border-b border-gray-300 text-gray-600 uppercase text-[10px] tracking-wider">
              Log del server (da Puppeteer)
            </div>
            <div
              className="px-3 py-3 max-h-37.5 overflow-y-auto flex flex-col gap-1"
              ref={logBodyRef}
            >
              {logs.map((log, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static
                <div key={i} className="leading-relaxed">
                  <span style={{ color: SECTION_COLORS.BOARD }}>&gt;</span>{' '}
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Kanban board */}
          <main className="block columns-3 column-gap-4 px-5 py-5 flex-1 overflow-x-auto">
            {sections &&
              SECTION_KEYS.map((key) => (
                <SectionColumn
                  key={key}
                  sectionKey={key}
                  members={sections[key]}
                  onEdit={(i) => setEditModal({ section: key, index: i })}
                  onAddNew={() => setEditModal({ section: key, index: null })}
                  onDragStart={(i) => handleDragStart(key, i)}
                  onDropOnCard={(ti) => handleDropOnCard(key, ti)}
                  onDropOnSection={() => handleDropOnSection(key)}
                  dragSource={dragSource.current}
                />
              ))}
          </main>
        </>
      ) : (
        <main className="flex-1 p-6 md:p-10 flex flex-col items-center w-full max-w-400 mx-auto">
          {previewData ? (
            <div className="w-full flex flex-col gap-6">
              {/* 1. Image Management Section */}
              <ImageSyncManager
                localImages={Object.values(sections || {})
                  .flat()
                  .filter(
                    (
                      m,
                    ): m is MemberData & {
                      localImage: string;
                      imageFilename: string;
                    } => Boolean(m.localImage && m.imageFilename),
                  )
                  .map((m) => ({
                    filename: m.imageFilename,
                    dataUrl: m.localImage,
                  }))}
                toDelete={previewData.images.toDelete}
              />

              {/* 2. HTML Diff Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">
                    Differenze HTML
                  </h2>
                  <span className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded">
                    Sinistra: Drupal attuale | Destra: Nuova versione
                  </span>
                </div>
                <div className="p-0">
                  <DiffViewer
                    oldCode={previewData.oldHtml}
                    newCode={previewData.newHtml}
                  />
                </div>
              </div>

              {/* 3. Final Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 text-sm flex gap-3 items-start mt-4">
                <AlertTriangle className="shrink-0 mt-0.5" />
                <div>
                  <strong>Attenzione:</strong> Il salvataggio finale su Drupal
                  non è automatico. Copia il codice dalla colonna di destra
                  (Nuova versione) e incollalo manualmente su Drupal se
                  necessario, oppure usa il metodo manuale. Questo tool
                  automatizza solo le immagini.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Caricamento anteprima...</div>
          )}
        </main>
      )}

      {/* Modal */}
      {editModal && (
        <MemberModal
          member={modalMember ?? null}
          sectionKey={editModal.section}
          onSave={(updated) =>
            handleEditSave(editModal.section, modalIndex, updated)
          }
          onClose={() => setEditModal(null)}
          onDelete={() =>
            modalIndex !== null && handleDelete(editModal.section, modalIndex)
          }
        />
      )}
    </div>
  );
}
