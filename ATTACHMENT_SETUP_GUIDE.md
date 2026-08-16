# Live Chat Attachments - Setup Guide

## Overview
This document outlines the required setup to enable file attachment support for the public Oak Cherry Kraft live chat widget.

## Components Implemented

### Frontend Components
- **ChatInput.tsx**: Updated with file selection UI (📎 paperclip button), file preview, and validation
- **ChatMessage.tsx**: Updated to display attachments with download links
- **ChatWindow.tsx**: Updated to propagate attachments through message send pipeline
- **ChatWidget.tsx**: Updated to call `uploadAttachments()` before message creation

### Utility Libraries
- **attachmentUtils.ts**: Validation utilities (file type, size, count, filename sanitization)
- **attachmentClient.ts**: Upload client that communicates with Edge Function proxy

### Backend Services
- **supabase/functions/live_chat_proxy/index.ts**: New `/attachment/upload` endpoint (POST)
  - Accepts FormData with file, session_id, visitor_token
  - Validates visitor ownership
  - Uploads to `live-chat-attachments` storage bucket
  - Returns attachment metadata JSON

## Setup Instructions

### 1. Create Supabase Storage Bucket

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** → **Buckets**
4. Click **Create a new bucket**
5. Enter name: `live-chat-attachments`
6. Set bucket to **PRIVATE**
7. Leave the bucket as **not public**
8. Click **Create bucket**

### 2. Configure Storage Bucket RLS Policies

Execute the following SQL in the Supabase SQL Editor to set up RLS policies:

```sql
-- Policy 1: Authenticated admins can read attachments via the app's signed URL flow
CREATE POLICY "Admin users can read live chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'live-chat-attachments' AND
  auth.uid() IS NOT NULL
);

-- Policy 2: Deny public/anon access
CREATE POLICY "Deny public access to live chat attachments"
ON storage.objects
FOR SELECT
TO anon
USING (false);
```

**Important:** The bucket must remain private. If the live chat needs to display an image or document, the app requests a short-lived signed URL from the Edge Function rather than using a public URL.

**Note:** File uploads are handled by the Edge Function using the service role key, which bypasses RLS for controlled upload operations. The bucket is not exposed publicly.

### 3. Environment Variables

Ensure these environment variables are set in your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LIVE_CHAT_PROXY_URL=https://your-project.supabase.co/functions/v1/live_chat_proxy
```

For local development, these default to:
```env
VITE_LIVE_CHAT_PROXY_URL=http://localhost:54321/functions/v1/live_chat_proxy
```

## Signed URL Flow

The public bucket is intentionally not used for live-chat attachments.

Instead, the flow is:

1. Visitor uploads a file through `live_chat_proxy` → `/attachment/upload`
2. The uploaded object path is stored in the message metadata, such as:
   `session-id/filename.jpg`
3. When an admin or authorized visitor opens the attachment, the frontend requests a short-lived signed URL from:
   `POST /attachment/signed-url`
4. The Edge Function authenticates the request, verifies the session/message ownership, and generates a signed URL from Supabase Storage.
5. The browser uses that signed URL only for the file preview/download window.

This keeps the bucket private while still allowing secure viewing/downloading.

## Feature Details

### Supported File Types
- Images: JPEG, PNG, WEBP
- Documents: PDF, DOC, DOCX

### File Constraints
- Maximum file size: 10 MB per file
- Maximum attachments per message: 5 files
- Maximum total request size: 50 MB

### File Storage Path Structure
```
live-chat-attachments/
├── {session_id}/
│   ├── {timestamp}-{random}.jpg
│   ├── {timestamp}-{random}.pdf
│   └── ...
```

## UI Features

### Public Chat (ChatWidget)
1. **Attachment Button**: 📎 paperclip button in message composer
2. **File Selection**: Click button to select multiple files (up to 5)
3. **File Preview**: Shows selected files with name, size, and remove button
4. **Error Display**: Clear error messages for validation failures (type, size, count)
5. **Upload on Send**: Files upload only when message is sent (not immediately)
6. **Attachment Display**: Files shown in message bubble with:
   - File icon (🖼️ for images, 📄 for PDFs, 📝 for docs, 📎 for other)
   - Filename (clickable download link)
   - File size

### Admin Dashboard (LiveChatMessages)
- Admins can view and download attachments from visitor messages
- Attachments displayed with same formatting as public chat

## Security Features

1. **Visitor Validation**: Each upload is validated against session_id + visitor_token pair
2. **MIME Type Verification**: Files validated by MIME type before upload
3. **Extension Validation**: Double-check via file extension
4. **Storage Access Control**: RLS policies restrict access to authenticated admin users only
5. **Rate Limiting**: 10 upload requests per visitor token per 60 seconds
6. **File Size Limits**: Max 10 MB per file, 50 MB total per request
7. **Filename Sanitization**: Removes path traversal and dangerous characters

## Cleanup on Session Deletion

When a live chat session is deleted via `deleteLiveChatSession()` or `deleteAllClosedChatSessions()`:
1. All associated attachment files are deleted from storage
2. Storage paths follow pattern: `{session_id}/{filename}`

**Implementation Note:** Add the following to the deletion functions in `src/lib/liveChat.ts`:

```typescript
// Delete associated attachments from storage
const { data: files } = await supabase.storage
  .from('live-chat-attachments')
  .list(sessionId);

if (files && files.length > 0) {
  const filePaths = files.map(f => `${sessionId}/${f.name}`);
  await supabase.storage
    .from('live-chat-attachments')
    .remove(filePaths);
}
```

## Troubleshooting

### Upload Fails with "Unsupported file type"
- Verify file MIME type is in supported list (image/jpeg, image/png, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- Check file extension is correct

### Upload Fails with "File too large"
- Verify file is under 10 MB
- For multiple files, ensure total doesn't exceed 50 MB

### "Too many requests" Error
- Rate limit is 10 uploads per visitor token per 60 seconds
- Wait 1 minute before attempting again

### Files Not Appearing in Admin View
- Verify RLS policies are applied to `live-chat-attachments` bucket
- Check attachment metadata is being stored in message metadata field
- Verify attachment paths are correct in metadata

## Testing Checklist

- [ ] Supabase Storage bucket created and set to PRIVATE
- [ ] RLS policies applied to bucket
- [ ] Environment variables configured
- [ ] Frontend build succeeds (`npm run build`)
- [ ] Chat widget loads in browser
- [ ] Can select files via 📎 button
- [ ] File preview displays with name and size
- [ ] Can remove files from preview
- [ ] Error message shown for unsupported file types
- [ ] Error message shown for oversized files
- [ ] Message with attachments sends successfully
- [ ] Attachments appear in admin chat view
- [ ] Can download attachments from admin panel
- [ ] Session deletion removes associated files

## Architecture Overview

```
Frontend (React)
├── ChatInput
│   └── File selection → attachmentUtils validation
├── ChatWidget (public)
│   └── Message send → attachmentClient.uploadAttachments()
└── ChatMessage
    └── Display attachments with download links

Edge Function (Deno)
├── /attachment/upload
│   ├── Validate visitor ownership
│   ├── Verify file type/size
│   └── Upload to Supabase Storage
└── Return attachment metadata

Supabase Storage
├── Bucket: live-chat-attachments (PRIVATE)
├── Structure: {session_id}/{filename}
└── RLS: Admin access only
```

## Notes

- SSE/Realtime subscription for messages is unchanged - attachments are included in message metadata
- Attachment display is handled client-side for both public and admin views
- Storage cleanup happens when sessions are deleted, not when messages are deleted
- File downloads use Supabase Storage public URLs (configured via RLS to require authentication when accessed directly)
