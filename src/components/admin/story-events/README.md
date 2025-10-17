Story Events components

Files added:

- `Editor.tsx` (client-only wrapper) and `Editor.client.tsx` (TipTap editor using StarterKit + Image + Link)
- `List.tsx` - table to display story events (id, title, createdAt, eventStart, rewardDistributedAt)
- `Leaderboard.tsx` - simple leaderboard table
- `sanitize.ts` - small wrapper around `isomorphic-dompurify` for server/client sanitization

Integration notes

- Import `Editor` dynamically in admin pages or use `next/dynamic` as shown in `Editor.tsx`.
- Always sanitize editor HTML client-side using `sanitizeHtml` before sending to server, and re-sanitize on the server.
- The backend admin endpoint for creating an event expects fields similar to the DTO: title, slug, bodyHtml (sanitized), eventStart (optional), rewardConfig (JSON). Adjust payload accordingly.
- Image upload: TipTap `Image` extension requires you to provide an image URL. Implement an upload endpoint that accepts file/multipart and returns a URL, then insert that URL into the editor via the `image` command.

Image upload details (implemented helper)

- Backend endpoints: the backend exposes multiple upload endpoints under `/uploads/*` (see backend `UploadsController`). I added `/uploads/story` which stores files at `assets/story/` and returns `{ path, thumbnails }`. These endpoints require admin JWT.
- Frontend helper: `admin-api.ts` now contains `uploadStoryImage(formData)` which POSTs multipart/form-data to `/uploads/story` and returns backend response. `adminApi` will attach Authorization headers automatically.
- Editor toolbar: `Editor.client.tsx` includes a small toolbar (Bold, Italic, Link, Image). The Image button opens a file picker and uploads the selected file via `/uploads/story`, then inserts the returned `thumbnails.medium` (if present) or `path` into the editor using TipTap `setImage`.

Security note

- Always re-sanitize HTML server-side before saving. The editor sanitizes on client via `sanitizeHtml`, but server-side validation is authoritative.

Next steps

- Wire these components into an admin route (e.g., `/admin/story-events`) and create pages for list, create/edit (not included in this change).
- Add a small toolbar to `Editor.client.tsx` depending on your UI kit (buttons for bold/italic/link/image).
