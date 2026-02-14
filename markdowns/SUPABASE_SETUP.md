# Fixing "Invalid Compact JWS" Error - Supabase Setup Guide

## Problem
You're seeing this error when uploading files:
```json
{
  "message": "File upload failed (Supabase auth). Check SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL in your .env."
}
```

## Solution Steps

### 1. Check Your `.env` File

Make sure you have a `.env` file in the project root with these variables:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Get Your Supabase Credentials

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project** (or create one if you don't have it)
3. **Navigate to**: Settings → API
4. **Copy two values**:
   - **Project URL** → Paste as `SUPABASE_URL`
   - **service_role key** (under "Project API keys") → Paste as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Use the `service_role` key, NOT the `anon` key!

### 3. Create the Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Set name: `course-materials`
4. Choose **Public bucket** or configure RLS policies (see below)
5. Click **Create bucket**

### 4. Configure Storage Policies (if using private bucket)

If you made the bucket private, you have two options:

#### Option A: Make Bucket Public (Easiest for Development)
1. Go to **Storage** → `course-materials` bucket
2. Click **3 dots menu** → **Edit bucket**
3. Toggle **Public bucket** to ON
4. Click **Save**

#### Option B: Add RLS Policies (Production-Ready)

Go to **SQL Editor** and run this:

```sql
-- Allow service role to upload
CREATE POLICY "Service role can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-materials');

-- Allow service role to delete
CREATE POLICY "Service role can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-materials');

-- Allow public reads (anyone can download)
CREATE POLICY "Anyone can read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-materials');

-- Allow updates (optional)
CREATE POLICY "Service role can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-materials')
WITH CHECK (bucket_id = 'course-materials');
```

Or add them via **Storage** → `course-materials` → **Policies** → **New Policy**

### 5. Common Issues

#### Issue: "Invalid Compact JWS"
**Cause**: Wrong key or malformed key
**Fix**: 
- Make sure you copied the **service_role** key, not the anon key
- Check for extra spaces or newlines in the `.env` file
- The key should start with `eyJ...`

#### Issue: Key has spaces/newlines
**Fix**: The key should be on ONE line:
```env
# ❌ Wrong
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJpc3MiOiJzdXBhYmFzZSI...

# ✅ Correct
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

#### Issue: 403 Forbidden or "new row violates row-level security policy"
**Cause**: Storage RLS policies blocking the upload
**Fix**: 
- **Quick fix**: Make the bucket public (see step 4, Option A)
- **Production fix**: Add RLS policies (see step 4, Option B)
- Verify policies exist: Go to Storage → `course-materials` → Policies tab

### 6. Verify Setup

Restart your server:
```bash
npm run dev
```

You should see:
```
✅ All required environment variables are set
```

If you see warnings about missing variables, add them to `.env`.

### 7. Test Upload

Try uploading a file via the materials endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/materials \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "type=file" \
  -F "lecture_id=1" \
  -F "file=@/path/to/test.pdf"
```

## Quick Checklist

- [ ] `.env` file exists in project root
- [ ] `SUPABASE_URL` is set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (starts with `eyJ`)
- [ ] No extra spaces/newlines in the key
- [ ] Storage bucket `course-materials` exists in Supabase
- [ ] Bucket is public OR has proper RLS policies
- [ ] Server restarted after `.env` changes
- [ ] See "✅ All required environment variables are set" on startup

---

Still having issues? Check the server logs for more details:
```bash
tail -f logs/combined.log
```
