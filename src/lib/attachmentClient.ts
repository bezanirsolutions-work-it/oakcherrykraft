/**
 * Client for uploading chat attachments through the Edge Function proxy
 * Handles file uploads securely with proper validation and error handling
 */

import { supabase } from './supabase';
import { AttachmentMetadata } from './attachmentUtils';

const PROXY_BASE = import.meta.env.VITE_LIVE_CHAT_PROXY_URL || 'http://localhost:54321/functions/v1/live_chat_proxy';

export function normalizeAttachmentPath(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const objectIndex = pathParts.findIndex((segment) => segment === 'object');
      if (objectIndex >= 0 && pathParts[objectIndex + 1] === 'public') {
        const bucketIndex = objectIndex + 2;
        if (pathParts[bucketIndex]) {
          return pathParts.slice(bucketIndex + 1).join('/');
        }
      }
      if (objectIndex >= 0 && pathParts[objectIndex + 1]) {
        return pathParts.slice(objectIndex + 2).join('/');
      }
    } catch {
      return null;
    }
    return null;
  }

  return trimmed.replace(/^\/+/, '');
}

export async function uploadAttachments(
  files: File[],
  sessionId: string,
  visitorToken: string
): Promise<AttachmentMetadata[]> {
  if (files.length === 0) {
    return [];
  }

  const attachments: AttachmentMetadata[] = [];

  for (const file of files) {
    try {
      const attachment = await uploadAttachment(file, sessionId, visitorToken);
      attachments.push(attachment);
    } catch (err) {
      throw new Error(
        `Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  return attachments;
}

export async function requestAttachmentSignedUrl(
  path: string,
  options?: { sessionId?: string; visitorToken?: string }
): Promise<{ url: string; expiresAt: string; path: string }> {
  const normalizedPath = normalizeAttachmentPath(path);
  if (!normalizedPath) {
    throw new Error('Attachment could not be loaded.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const payload: Record<string, string> = { path: normalizedPath };

  if (options?.sessionId) payload.session_id = options.sessionId;
  if (options?.visitorToken) payload.visitor_token = options.visitorToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (sessionData.session?.access_token) {
    headers.Authorization = `Bearer ${sessionData.session.access_token}`;
  }

  const res = await fetch(`${PROXY_BASE}/attachment/signed-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    throw new Error(parsed?.error || 'Attachment could not be loaded.');
  }

  if (!parsed?.url) {
    throw new Error('Attachment could not be loaded.');
  }

  return parsed as { url: string; expiresAt: string; path: string };
}

async function uploadAttachment(
  file: File,
  sessionId: string,
  visitorToken: string
): Promise<AttachmentMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', sessionId);
  formData.append('visitor_token', visitorToken);

  const url = `${PROXY_BASE}/attachment/upload`;
  console.log('[ATTACHMENT-UPLOAD-DEBUG] Starting upload', {
    file: file.name,
    type: file.type,
    size: file.size,
    sessionId,
    url,
  });

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  console.log('[ATTACHMENT-UPLOAD-DEBUG] Response received', {
    status: res.status,
    statusText: res.statusText,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = 'Upload failed';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    console.error('[ATTACHMENT-UPLOAD-ERROR]', { status: res.status, message: errorMessage });
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data as AttachmentMetadata;
}
