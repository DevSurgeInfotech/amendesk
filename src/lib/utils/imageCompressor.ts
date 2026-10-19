export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatioPercent: number;
}

/**
 * Compresses an image in-browser using HTML5 Canvas.
 * Generates an optimized WebP/JPEG blob, full-res dataUrl, and a lightweight micro-thumbnail (~15KB).
 * Reduces raw 5-15MB phone camera captures down to ~150-350KB without perceptual degradation.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`File ${file.name} is not an image`));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (!dataUri) {
        return reject(new Error('Failed to read image as data URL'));
      }

      const img = new Image();
      img.onerror = () => reject(new Error(`Failed to load image elements for ${file.name}`));
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Draw compressed main image
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get 2D canvas context'));
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Micro-thumbnail canvas (160px wide)
        const thumbCanvas = document.createElement('canvas');
        const thumbWidth = 160;
        const thumbHeight = Math.max(1, Math.round((height * thumbWidth) / width));
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.imageSmoothingEnabled = true;
          thumbCtx.imageSmoothingQuality = 'medium';
          thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
        }
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.65);

        // Export main compressed blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas toBlob returned null'));
            }

            const cleanFileName = file.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '_');
            const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
            const compressedFile = new File([blob], `${cleanFileName}.${extension}`, {
              type: mimeType,
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL(mimeType, quality);
            const originalSizeBytes = file.size;
            const compressedSizeBytes = blob.size;
            const savedBytes = Math.max(0, originalSizeBytes - compressedSizeBytes);
            const compressionRatioPercent =
              originalSizeBytes > 0 ? Math.round((savedBytes / originalSizeBytes) * 100) : 0;

            resolve({
              file: compressedFile,
              blob,
              dataUrl,
              thumbnailUrl,
              width,
              height,
              originalSizeBytes,
              compressedSizeBytes,
              compressionRatioPercent,
            });
          },
          mimeType,
          quality
        );
      };
      img.src = dataUri;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable string (KB / MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
