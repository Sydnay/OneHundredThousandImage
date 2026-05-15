import { createHash } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY    = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File too large. Max 5 MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64  = `data:${file.type};base64,${buffer.toString('base64')}`;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash('sha1')
    .update(`timestamp=${timestamp}${API_SECRET}`)
    .digest('hex');

  const upload = new FormData();
  upload.append('file', base64);
  upload.append('api_key', API_KEY);
  upload.append('timestamp', timestamp);
  upload.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: upload,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Cloudinary error:', data);
    return Response.json({ error: data?.error?.message ?? 'Upload failed' }, { status: 500 });
  }

  return Response.json({ url: data.secure_url });
}
