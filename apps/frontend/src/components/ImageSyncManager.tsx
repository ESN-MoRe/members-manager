import { ArrowRight, CheckCircle, CloudUpload, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { imgUrl } from '../utils';

interface ImageSyncManagerProps {
  toUpload: string[];
  toDelete: string[];
}

export default function ImageSyncManager({
  toUpload,
  toDelete,
}: ImageSyncManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<null | {
    success: number;
    failed: number;
  }>(null);

  const handleSync = async () => {
    if (toUpload.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch('/v1/members/deploy-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: toUpload }),
      });
      const data = await res.json();

      const successCount = data.results.filter(
        (r: { status: string }) => r.status === 'success',
      ).length;
      setUploadResult({
        success: successCount,
        failed: data.results.length - successCount,
      });
    } catch (err) {
      console.error('Error during image sync:', err);
      alert('Errore durante il sync delle immagini');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {/* Upload Column */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <CloudUpload className="text-blue-500" size={20} />
            Da caricare su Drupal
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {toUpload.length}
            </span>
          </h3>
          {toUpload.length > 0 && !uploadResult && (
            <button
              type="button"
              onClick={handleSync}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {uploading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
              {uploading ? 'Caricamento...' : 'Carica ora'}
            </button>
          )}
        </div>

        {uploadResult ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <p className="font-bold text-green-800">Operazione completata</p>
            <p className="text-sm text-green-700">
              {uploadResult.success} caricati, {uploadResult.failed} falliti.
            </p>
          </div>
        ) : toUpload.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Nessuna nuova immagine da caricare.
          </p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {toUpload.map((filename) => (
              <li
                key={filename}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                {/* We use local server path for preview if possible, otherwise rely on fallback */}
                <img
                  src={`/members-img/${filename}`} // Assumes NestJS serves static from public
                  alt=""
                  className="w-10 h-10 rounded object-cover bg-gray-200"
                  onError={(e) => (e.currentTarget.src = imgUrl(filename))} // Fallback
                />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {filename}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Column */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm opacity-70">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Trash2 className="text-red-500" size={20} />
          Inutilizzate (Info)
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
            {toDelete.length}
          </span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Queste immagini sono presenti nel vecchio HTML ma non nel nuovo.
          Drupal non le cancella automaticamente.
        </p>

        {toDelete.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Nessuna immagine rimossa.
          </p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {toDelete.map((filename) => (
              <li
                key={filename}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                <img
                  src={imgUrl(filename)}
                  alt=""
                  className="w-8 h-8 rounded object-cover grayscale opacity-60"
                />
                <span className="text-sm text-gray-500 truncate line-through">
                  {filename}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
