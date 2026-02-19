import { AlertTriangle, Camera, RefreshCw, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  ROLE_SUGGESTIONS,
  SECTION_BG,
  SECTION_COLORS,
  SECTION_KEYS,
} from './constants';
import SectionColumn from './SectionColumn';
import type { MemberData, SectionsState, SectionType } from './types';
import { imgUrl, initials, parseDrupalHtml } from './utils';

// --- TYPES ---

// --- HELPERS ---

// --- MODAL ---
interface ModalProps {
  member: MemberData | null;
  sectionKey: SectionType;
  onSave: (updated: MemberData) => void;
  onClose: () => void;
  onDelete: () => void;
}

function MemberModal({
  member,
  sectionKey,
  onSave,
  onClose,
  onDelete,
}: ModalProps) {
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState(member?.role ?? '');
  const [imageFilename, setImageFilename] = useState(
    member?.imageFilename ?? '',
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const color = SECTION_COLORS[sectionKey];
  const isNew = !member?.name;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      const safeName = name
        ? `${name.toLowerCase().replace(/ /g, '_')}.${file.name.split('.').pop()}`
        : file.name;
      form.append('photo', file);
      form.append('filename', safeName);
      const res = await fetch(`/v1/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload fallito');
      const data = await res.json();
      setImageFilename(data.filename);
    } catch (_err) {
      setUploadError('Errore upload. Riprova.');
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), role: role.trim(), imageFilename });
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-35 z-[200] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl px-7 py-6 w-full max-w-md shadow-2xl"
        style={{ borderTop: `4px solid ${color}` }}
      >
        <div className="flex items-center justify-between mb-4.5">
          <h2 className="font-bold text-lg m-0" style={{ color }}>
            {isNew ? 'Aggiungi membro' : 'Modifica membro'}
          </h2>
          <button
            className="bg-none border-none text-lg cursor-pointer text-gray-500 leading-none"
            onClick={onClose}
            type="button"
            title="Chiudi"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview avatar */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            {imageFilename ? (
              <img
                src={imgUrl(imageFilename)}
                alt={name}
                className="w-20 h-20 rounded-full object-cover block"
                style={{ border: `3px solid ${color}` }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full object-cover block flex items-center justify-center text-2xl font-bold"
                style={{
                  background: SECTION_BG[sectionKey],
                  border: `3px solid ${color}`,
                  color,
                }}
              >
                {initials(name) || '?'}
              </div>
            )}
            <button
              type="button"
              className="absolute bottom-0 right-0 border-none rounded-full w-7 h-7 cursor-pointer text-sm flex items-center justify-center text-white"
              style={{ background: color }}
              onClick={() => fileRef.current?.click()}
              title="Carica foto"
            >
              {uploading ? '...' : <Camera size={16} />}
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        {uploadError && (
          <p className="text-red-600 text-center m-0 mb-3 text-sm">
            {uploadError}
          </p>
        )}

        <div className="mb-4">
          <label
            className="block text-sm font-semibold text-gray-600 mb-1.25"
            htmlFor="fullname"
          >
            Nome completo
          </label>
          <input
            id="fullname"
            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm outline-none box-border font-inherit"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Mario Rossi"
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-sm font-semibold text-gray-600 mb-1.25"
            htmlFor="role"
          >
            Ruolo
          </label>
          <input
            id="role"
            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm outline-none box-border font-inherit"
            list="roles-list"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="es. Presidente"
          />
          <datalist id="roles-list">
            {ROLE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        {imageFilename && (
          <p className="text-xs text-gray-500 m-0 mb-4">📎 {imageFilename}</p>
        )}

        <div className="flex gap-2 mt-5 items-center">
          {!isNew && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg border-none font-semibold text-sm cursor-pointer bg-red-50 text-red-600 border border-red-200"
              onClick={onDelete}
            >
              Rimuovi
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold text-sm cursor-pointer"
            onClick={onClose}
          >
            Annulla
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border-none font-semibold text-sm cursor-pointer text-white"
            style={{ background: color }}
            onClick={handleSave}
          >
            {isNew ? 'Aggiungi' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MEMBER CARD ---

// --- APP ---
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
        <div className="fixed bottom-5 right-5 bg-white rounded-xl px-5 py-4 flex flex-col items-center shadow-lg z-[150]">
          <div className="w-9 h-9 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="mt-2 text-xs text-blue-500">Caricamento...</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-2.5">
          <img
            src="https://more.esn.it/sites/esnmodena.it/files/web-it-mode-esn-colour-black.png"
            alt="ESN Logo"
            className="h-10 mr-2.5"
          />
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            ESN MoRe Team Manager
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
          className="px-3 py-3 max-h-[150px] overflow-y-auto flex flex-col gap-1"
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
