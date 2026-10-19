import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB max input before client compression

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entityType = ((formData.get('entityType') as string) || 'general').toLowerCase();
    
    // Sanitize entityType to alphanumeric + underscores
    const safeCategory = entityType.replace(/[^a-z0-9_-]/g, '') || 'general';

    // Collect all uploaded files (supports "files" array or single "file")
    const incomingFiles: File[] = [];
    const filesList = formData.getAll('files');
    const singleFile = formData.get('file');

    if (filesList && filesList.length > 0) {
      for (const item of filesList) {
        if (item instanceof File && item.size > 0) {
          incomingFiles.push(item);
        }
      }
    } else if (singleFile instanceof File && singleFile.size > 0) {
      incomingFiles.push(singleFile);
    }

    if (incomingFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided in upload request' },
        { status: 400 }
      );
    }

    // Ensure target storage directory exists in public/uploads/<category>
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', safeCategory);
    await mkdir(uploadsDir, { recursive: true });

    const uploadedResults: Array<{
      url: string;
      fileName: string;
      originalName: string;
      sizeBytes: number;
      mimeType: string;
    }> = [];

    for (const file of incomingFiles) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF, PDF`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${file.name} exceeds max size of 15MB`,
          },
          { status: 400 }
        );
      }

      // Generate sanitized, timestamped unique filename
      const originalExt = path.extname(file.name).toLowerCase() || '.webp';
      const cleanBase = path
        .basename(file.name, originalExt)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 32);
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const finalFileName = `${cleanBase || 'asset'}_${uniqueSuffix}${originalExt}`;
      const filePath = path.join(uploadsDir, finalFileName);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${safeCategory}/${finalFileName}`;
      uploadedResults.push({
        url: publicUrl,
        fileName: finalFileName,
        originalName: file.name,
        sizeBytes: buffer.byteLength,
        mimeType: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      category: safeCategory,
      count: uploadedResults.length,
      files: uploadedResults,
    });
  } catch (error) {
    console.error('File upload error in /api/upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal upload processing error',
      },
      { status: 500 }
    );
  }
}
