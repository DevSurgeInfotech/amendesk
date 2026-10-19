import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { MediaAttachment } from '@/lib/types';
import { compressImage } from './imageCompressor';

export interface UploadOptions {
  entityType: 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'AUCTION';
  entityId?: string;
  isPrimary?: boolean;
  caption?: string;
}

export interface UploadItemResult {
  attachmentId: string;
  url: string; // Either permanent /uploads/... URL or local dataUrl if offline
  dataUrl?: string;
  fileName: string;
  fileSizeBytes: number;
  syncStatus: 'LOCAL' | 'SYNCED' | 'FAILED';
  isLocalOnly: boolean;
}

/**
 * Uploads an image file with in-browser compression, offline Dexie fallback, and background sync.
 */
export async function uploadProductPhoto(
  file: File,
  options: UploadOptions
): Promise<UploadItemResult> {
  const attachmentId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // Step 1: Compress client-side
  let compressedDataUrl: string;
  let finalFile: File;
  let finalSize: number;

  try {
    const comp = await compressImage(file, {
      maxWidth: 1600,
      maxHeight: 1200,
      quality: 0.82,
      mimeType: 'image/webp',
    });
    compressedDataUrl = comp.dataUrl;
    finalFile = comp.file;
    finalSize = comp.compressedSizeBytes;
  } catch (err) {
    console.warn('Compression fallback to original file:', err);
    finalFile = file;
    finalSize = file.size;
    compressedDataUrl = await fileToDataUrl(file);
  }

  // Step 2: Attempt online upload if navigator is online
  let remoteUrl: string | undefined;
  let isLocalOnly = true;

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const formData = new FormData();
      formData.append('entityType', options.entityType.toLowerCase());
      formData.append('file', finalFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.files?.[0]?.url) {
          remoteUrl = json.files[0].url;
          isLocalOnly = false;
        }
      }
    } catch (netErr) {
      console.warn('Upload API network failed, saving offline:', netErr);
    }
  }

  // Step 3: Record in Dexie mediaAttachments table
  const finalUrl = remoteUrl || compressedDataUrl;
  const syncStatus = isLocalOnly ? 'LOCAL' : 'SYNCED';

  const attachment: MediaAttachment = {
    id: attachmentId,
    entityType: options.entityType,
    entityId: options.entityId || 'pending',
    fileName: finalFile.name,
    fileType: finalFile.type,
    fileSizeBytes: finalSize,
    dataUrl: compressedDataUrl,
    remoteUrl,
    isPrimary: Boolean(options.isPrimary),
    caption: options.caption,
    syncStatus,
    createdAt: nowIso,
  };

  try {
    await db.mediaAttachments.add(attachment);
    if (isLocalOnly) {
      await syncEngine.queueMutation('mediaAttachments', attachmentId, 'CREATE', {
        attachmentId,
        entityType: options.entityType,
        fileName: finalFile.name,
        fileSizeBytes: finalSize,
        syncStatus: 'LOCAL',
      });
    }
  } catch (dbErr) {
    console.error('Failed to cache media attachment in Dexie:', dbErr);
  }

  return {
    attachmentId,
    url: finalUrl,
    dataUrl: compressedDataUrl,
    fileName: finalFile.name,
    fileSizeBytes: finalSize,
    syncStatus,
    isLocalOnly,
  };
}

/**
 * Uploads a document (PDF or scanned image) such as Site Plans, Indentures, Court Fi-Fa Writs.
 */
export async function uploadDocumentFile(
  file: File,
  options: UploadOptions
): Promise<UploadItemResult> {
  const attachmentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const dataUrl = await fileToDataUrl(file);

  let remoteUrl: string | undefined;
  let isLocalOnly = true;

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const formData = new FormData();
      formData.append('entityType', options.entityType.toLowerCase());
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.files?.[0]?.url) {
          remoteUrl = json.files[0].url;
          isLocalOnly = false;
        }
      }
    } catch (netErr) {
      console.warn('Document upload API failed, saving offline:', netErr);
    }
  }

  const finalUrl = remoteUrl || dataUrl;
  const syncStatus = isLocalOnly ? 'LOCAL' : 'SYNCED';

  const attachment: MediaAttachment = {
    id: attachmentId,
    entityType: options.entityType,
    entityId: options.entityId || 'pending',
    fileName: file.name,
    fileType: file.type,
    fileSizeBytes: file.size,
    dataUrl,
    remoteUrl,
    isPrimary: false,
    caption: options.caption,
    syncStatus,
    createdAt: nowIso,
  };

  try {
    await db.mediaAttachments.add(attachment);
  } catch (err) {
    console.error('Failed to store document attachment in Dexie:', err);
  }

  return {
    attachmentId,
    url: finalUrl,
    dataUrl,
    fileName: file.name,
    fileSizeBytes: file.size,
    syncStatus,
    isLocalOnly,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
