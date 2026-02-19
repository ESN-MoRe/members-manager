import { useEffect, useRef, useState } from 'react';

// --- TYPES ---
interface MemberData {
  name: string;
  role: string;
  imageFilename?: string;
}

type SectionType = 'BOARD' | 'SUPPORTERS' | 'ACTIVE' | 'ALUMNI';
type SectionsState = Record<SectionType, MemberData[]>;

const SECTION_LABELS: Record<SectionType, string> = {
  BOARD: 'Board',
  SUPPORTERS: 'Board Supporters',
  ACTIVE: 'Active Members',
  ALUMNI: 'Alumni Network',
};

const SECTION_COLORS: Record<SectionType, string> = {
  BOARD: '#00aeef',
  SUPPORTERS: '#f47b20',
  ACTIVE: '#ec008c',
  ALUMNI: '#6c757d',
};

const SECTION_BG: Record<SectionType, string> = {
  BOARD: 'rgba(0,174,239,0.08)',
  SUPPORTERS: 'rgba(244,123,32,0.08)',
  ACTIVE: 'rgba(236,0,140,0.08)',
  ALUMNI: 'rgba(108,117,125,0.10)',
};

const _API_BASE = 'http://localhost:3000';
const SECTION_KEYS: SectionType[] = ['BOARD', 'SUPPORTERS', 'ACTIVE', 'ALUMNI'];

const ROLE_SUGGESTIONS = [
  'Presidente',
  'Vicepresidente',
  'Segretario',
  'Segretaria',
  'Tesoriere',
  'Tesoriera',
  'Webmaster',
  'Event Manager',
  'Partnership Manager',
  'Active Member',
  'Alumno',
  'Alumna',
  'Referente Reggio Emilia',
  'Responsabile AskErasmus',
  "Responsabile corso d'italiano",
  'Coordinatrice Culture',
  'Coordinatrice Education & Youth',
  'Coordinatore Environmental Sustainability',
  'Coordinatore Health & Well-Being',
  'Coordinatore Skills & Employability',
  'Coordinatore Social Inclusion',
];

// --- HELPERS ---
function imgUrl(filename?: string) {
  if (!filename) return '';
  return new URL(
    filename,
    'https://more.esn.it/sites/esnmodena.it/files/members/',
  ).href;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

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
      style={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ ...styles.modal, borderTop: `4px solid ${color}` }}>
        <div style={styles.modalHeader}>
          <h2 style={{ ...styles.modalTitle, color }}>
            {isNew ? 'Aggiungi membro' : 'Modifica membro'}
          </h2>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            type="button"
            title="Chiudi"
          >
            ✕
          </button>
        </div>

        {/* Preview avatar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ position: 'relative' }}>
            {imageFilename ? (
              <img
                src={imgUrl(imageFilename)}
                alt={name}
                style={{ ...styles.avatarLg, border: `3px solid ${color}` }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                style={{
                  ...styles.avatarLg,
                  background: SECTION_BG[sectionKey],
                  border: `3px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {initials(name) || '?'}
              </div>
            )}
            <button
              type="button"
              style={{ ...styles.uploadBtn, background: color }}
              onClick={() => fileRef.current?.click()}
              title="Carica foto"
            >
              {uploading ? '...' : '📷'}
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
          <p
            style={{
              color: '#e00',
              textAlign: 'center',
              margin: '0 0 12px',
              fontSize: 13,
            }}
          >
            {uploadError}
          </p>
        )}

        <div style={styles.field}>
          <label style={styles.label} htmlFor="fullname">
            Nome completo
          </label>
          <input
            id="fullname"
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Mario Rossi"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="role">
            Ruolo
          </label>
          <input
            id="role"
            style={styles.input}
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
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
            📎 {imageFilename}
          </p>
        )}

        <div style={styles.modalActions}>
          {!isNew && (
            <button
              type="button"
              style={{
                ...styles.btn,
                background: '#fee',
                color: '#c00',
                border: '1px solid #fcc',
              }}
              onClick={onDelete}
            >
              Rimuovi
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            style={{ ...styles.btn, background: '#f0f0f0', color: '#333' }}
            onClick={onClose}
          >
            Annulla
          </button>
          <button
            type="button"
            style={{ ...styles.btn, background: color, color: '#fff' }}
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
interface CardProps {
  member: MemberData;
  sectionKey: SectionType;
  index: number;
  onEdit: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

function MemberCard({
  member,
  sectionKey,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: CardProps) {
  const color = SECTION_COLORS[sectionKey];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        borderLeft: `3px solid ${color}`,
        background: hovered ? SECTION_BG[sectionKey] : '#fff',
        opacity: isDragOver ? 0.5 : 1,
        outline: isDragOver ? `2px dashed ${color}` : 'none',
      }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        {member.imageFilename ? (
          <img
            src={imgUrl(member.imageFilename)}
            alt={member.name}
            style={{ ...styles.avatar, boxShadow: `0 0 0 2px ${color}` }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              const next = el.nextElementSibling as HTMLElement;
              if (next) next.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          style={{
            ...styles.avatarFallback,
            background: SECTION_BG[sectionKey],
            color,
            display: member.imageFilename ? 'none' : 'flex',
            boxShadow: `0 0 0 2px ${color}`,
          }}
        >
          {initials(member.name)}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: '#1a1a1a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color,
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {member.role || '—'}
        </div>
      </div>

      {/* Drag handle + edit */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <span
          style={{
            color: '#bbb',
            cursor: 'grab',
            fontSize: 16,
            padding: '0 2px',
          }}
          title="Trascina"
        >
          ⠿
        </span>
        <button
          type="button"
          style={styles.editBtn}
          onClick={onEdit}
          title="Modifica"
        >
          ✏️
        </button>
      </div>
    </div>
  );
}

// --- SECTION COLUMN ---
interface SectionColumnProps {
  sectionKey: SectionType;
  members: MemberData[];
  onEdit: (idx: number) => void;
  onAddNew: () => void;
  onDragStart: (memberIdx: number) => void;
  onDropOnCard: (targetIdx: number) => void;
  onDropOnSection: () => void;
  dragSource: { section: SectionType; index: number } | null;
}

function SectionColumn({
  sectionKey,
  members,
  onEdit,
  onAddNew,
  onDragStart,
  onDropOnCard,
  onDropOnSection,
  dragSource,
}: SectionColumnProps) {
  const color = SECTION_COLORS[sectionKey];
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverSection, setDragOverSection] = useState(false);

  return (
    <div
      style={{ ...styles.column, borderTop: `3px solid ${color}` }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverSection(true);
      }}
      onDragLeave={() => setDragOverSection(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverSection(false);
        onDropOnSection();
      }}
    >
      <div style={styles.columnHeader}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color }}>
            {SECTION_LABELS[sectionKey]}
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            {members.length} {members.length === 1 ? 'membro' : 'membri'}
          </div>
        </div>
        <button
          type="button"
          style={{ ...styles.addBtn, color, borderColor: color }}
          onClick={onAddNew}
          title="Aggiungi membro"
        >
          ＋
        </button>
      </div>

      <div
        style={{
          ...styles.cardList,
          outline:
            dragOverSection && dragSource?.section !== sectionKey
              ? `2px dashed ${color}`
              : 'none',
          borderRadius: 8,
        }}
      >
        {members.length === 0 && (
          <div
            style={{
              padding: '20px 0',
              textAlign: 'center',
              color: '#bbb',
              fontSize: 13,
            }}
          >
            Nessun membro.
            <br />
            Trascina qui o aggiungi.
          </div>
        )}
        {members.map((m, i) => (
          <MemberCard
            key={`${m.name}-${i}`}
            member={m}
            sectionKey={sectionKey}
            index={i}
            onEdit={() => onEdit(i)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              onDragStart(i);
            }}
            onDragOver={() => setDragOverIdx(i)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverIdx(null);
              onDropOnCard(i);
            }}
            isDragOver={dragOverIdx === i}
          />
        ))}
      </div>
    </div>
  );
}

function parseDrupalHtml(html: string): SectionsState {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const state: Partial<SectionsState> = {};

  // These labels must match exactly what's in your Drupal HTML aria-labels
  const sectionsConfig = [
    { key: 'BOARD' as SectionType, search: 'Board members' },
    { key: 'SUPPORTERS' as SectionType, search: 'Board Supporters' },
    { key: 'ACTIVE' as SectionType, search: 'Active Members' },
    { key: 'ALUMNI' as SectionType, search: 'Alumni Network' },
  ];

  sectionsConfig.forEach(({ key, search }) => {
    // Find the section by aria-label
    const sectionEl = Array.from(doc.querySelectorAll('section')).find((s) =>
      s.getAttribute('aria-label')?.includes(search),
    );

    if (sectionEl) {
      const items = Array.from(
        sectionEl.querySelectorAll('article[role="listitem"]'),
      );
      state[key] = items.map((article) => {
        const name = article.querySelector('h3')?.textContent?.trim() || '';
        const role =
          article.querySelector('p:last-of-type')?.textContent?.trim() || '';
        const img = article.querySelector('img')?.getAttribute('src') || '';
        const imageFilename = img.split('/').pop() || '';
        return { name, role, imageFilename };
      });
    } else {
      state[key] = [];
    }
  });

  return state as SectionsState;
}

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
      <div style={styles.centered}>
        <div style={{ textAlign: 'center', color: '#c00' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 600 }}>{error}</div>
          <div style={{ color: '#888', marginTop: 8, fontSize: 13 }}>
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
    <div style={styles.app}>
      {/* Floating Loading Indicator */}
      {loading && (
        <div style={styles.floatingLoader}>
          <div style={styles.spinner} />
          <span style={{ marginTop: 8, fontSize: 12, color: '#00aeef' }}>
            Caricamento...
          </span>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>ESN MoRe Team Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveMsg && (
            <span
              style={{
                fontSize: 14,
                color: saveMsg.startsWith('✅') ? '#28a745' : '#c00',
              }}
            >
              {saveMsg}
            </span>
          )}
          <button
            type="button"
            onClick={startStreaming}
            disabled={isStreaming}
            style={styles.secondaryBtn}
          >
            {isStreaming ? 'Syncando...' : '🔄 Synca'}
          </button>
          <button
            type="button"
            style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : '💾 Salva HTML'}
          </button>
        </div>
      </header>

      <div style={styles.logContainer}>
        <div style={styles.logHeader}>Log del server (da Puppeteer)</div>
        <div style={styles.logBody} ref={logBodyRef}>
          {logs.map((log, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static
            <div key={i} style={styles.logLine}>
              <span style={{ color: SECTION_COLORS.BOARD }}>&gt;</span> {log}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <main style={styles.board}>
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

// --- STYLES ---
const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoText: {
    fontWeight: 700,
    fontSize: 18,
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
  },
  saveBtn: {
    background: '#00aeef',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 18px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    padding: '20px 20px',
    flex: 1,
    alignItems: 'start',
    overflowX: 'auto',
  },
  column: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    minHeight: 200,
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 4,
    transition: 'outline 0.15s',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 10px',
    borderRadius: 8,
    cursor: 'grab',
    transition: 'background 0.15s',
    userSelect: 'none',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
  },
  avatarLg: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
  },
  editBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 4px',
    borderRadius: 4,
    lineHeight: 1,
  },
  addBtn: {
    background: 'none',
    border: '1.5px dashed',
    borderRadius: 6,
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 14,
    padding: '24px 28px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: { fontWeight: 700, fontSize: 18, margin: 0 },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#888',
    lineHeight: 1,
  },
  field: { marginBottom: 16 },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    border: '1.5px solid #ddd',
    borderRadius: 7,
    padding: '8px 10px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    gap: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  btn: {
    padding: '8px 16px',
    borderRadius: 7,
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  centered: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #e0e0e0',
    borderTop: '3px solid #00aeef',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    border: 'none',
    borderRadius: '50%',
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  logContainer: {
    margin: '20px 20px 0',
    background: '#1e1e1e',
    borderRadius: 8,
    overflow: 'hidden',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  logHeader: {
    padding: '8px 12px',
    background: '#333',
    borderBottom: '1px solid #444',
    color: '#aaa',
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: '0.05em',
  },
  logBody: {
    padding: '12px',
    maxHeight: '150px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  logLine: {
    lineHeight: 1.4,
  },
  secondaryBtn: {
    background: '#f0f0f0',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  floatingLoader: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    background: '#fff',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 150,
  },
};
