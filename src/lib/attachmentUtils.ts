/**
 * Attachment utilities for live-chat file uploads
 * Handles validation, sanitization, and metadata
 */

export const SUPPORTED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
} as const;

export const SUPPORTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
]);

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export interface AttachmentMetadata {
  name: string;
  type: string;
  size: number;
  path: string;
}

export interface AttachmentData {
  attachments?: AttachmentMetadata[];
}

export function isSupportedFileType(file: File): boolean {
  const ext = getFileExtension(file.name).toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Check by extension (simpler and more reliable)
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot);
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let safe = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  // Remove potentially dangerous characters
  safe = safe.replace(/[<>:"|?*\x00-\x1f]/g, '');
  // Limit length
  safe = safe.substring(0, 200);
  return safe || 'file';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function generateUniqueFilename(sessionId: string, messageId: string, originalFilename: string): string {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${sessionId}/${messageId}/${timestamp}-${random}${ext}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word') || mimeType.endsWith('wordprocessingml.document')) return '📝';
  return '📎';
}

export function validateAttachments(files: File[]): { valid: boolean; error?: string } {
  if (files.length === 0) {
    return { valid: true };
  }

  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return {
      valid: false,
      error: `Too many files. Maximum ${MAX_ATTACHMENTS_PER_MESSAGE} attachments per message.`,
    };
  }

  for (const file of files) {
    if (!isSupportedFileType(file)) {
      return {
        valid: false,
        error: `File type not supported: ${file.name}. Supported types: images (JPG, PNG, WEBP) and documents (PDF, DOC, DOCX).`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File is too large: ${file.name}. Maximum file size is ${formatFileSize(MAX_FILE_SIZE)}.`,
      };
    }
  }

  return { valid: true };
}
