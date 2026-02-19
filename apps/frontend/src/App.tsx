import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MemberModal from './components/MemberModal';
import { SECTION_COLORS, SECTION_KEYS } from './constants';
import SectionColumn from './SectionColumn';
import type { MemberData, SectionsState, SectionType } from './types';
import { parseDrupalHtml } from './utils';

export default function App() {
  const [sections, setSections] = useState<SectionsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

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

  function handleDragStart(section: SectionType, index: number) {
    dragSource.current = { section, index };
  }

  function handleDropOnCard(targetSection: SectionType, targetIndex: number) {
    const src = dragSource.current;
    if (!src || !sections) return;
    const next = { ...sections };

    const [moved] = next[src.section].splice(src.index, 1);
    if (src.section === targetSection && targetIndex > src.index) {
      next[targetSection].splice(targetIndex, 0, moved);
    } else {
      next[targetSection].splice(targetIndex, 0, moved);
    }
    setSections({ ...next });
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
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Manager membri
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveMsg && (
            <span
              className={`text-sm ${saveMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}
            >
              {saveMsg}
            </span>
          )}
          <button
            type="button"
            onClick={startStreaming}
            disabled={isStreaming}
            className="bg-gray-100 text-gray-700 border border-gray-300 rounded-lg px-3.5 py-2 flex items-center gap-2 font-semibold text-sm cursor-pointer"
          >
            {isStreaming ? (
              // 'Syncando...'
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
            className={`bg-blue-500 text-white flex items-center gap-2 border-none rounded-lg px-4.5 py-2 font-semibold text-sm cursor-pointer ${saving ? 'opacity-70' : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-200 border-t-white rounded-full animate-spin mr-1" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} /> Salva HTML
              </>
            )}
          </button>
        </div>
      </header>

      <div className="mx-5 mt-5 mb-0 bg-gray-800 rounded-lg overflow-hidden text-white font-mono text-xs shadow-lg">
        <div className="px-3 py-2 bg-gray-700 border-b border-gray-600 text-gray-400 uppercase text-[10px] tracking-wider">
          Log del server (da Puppeteer)
        </div>
        <div
          className="px-3 py-3 max-h-37.5 overflow-y-auto flex flex-col gap-1"
          ref={logBodyRef}
        >
          {logs.map((log, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static
            <div key={i} className="leading-relaxed">
              <span style={{ color: SECTION_COLORS.BOARD }}>&gt;</span> {log}
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
