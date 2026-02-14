# Fix Supabase Storage RLS Policy Error

## The Error

```
new row violates row-level security policy
```

This means your Supabase storage bucket has RLS enabled but no policies allow uploads.

## Quick Fix: Disable RLS (Development Only)

### Option 1: Make Bucket Public (Easiest for Development)

1. Go to [Supabase Dashboard](https://app.supabase.com/) → **Storage**
2. Find the `course-materials` bucket
3. Click the **3 dots menu** → **Edit bucket**
4. Toggle **Public bucket** to ON
5. Click **Save**

This allows uploads without authentication checks (good for development).

---

## Production Fix: Configure RLS Policies

If you want to keep the bucket private with RLS enabled, add these policies:

### Step 1: Go to Storage Policies

1. **Supabase Dashboard** → **Storage** → `course-materials` bucket
2. Click **Policies** tab
3. Click **New Policy**

### Step 2: Add Service Role Upload Policy

Click **"For full customization"** and paste this SQL:

```sql
-- Policy 1: Allow authenticated service role to INSERT files
CREATE POLICY "Service role can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials'
);
```

### Step 3: Add Service Role Delete Policy

Create another policy with this SQL:

```sql
-- Policy 2: Allow authenticated service role to DELETE files
CREATE POLICY "Service role can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials'
);
```

### Step 4: Add Read Policy (for students to download)

```sql
-- Policy 3: Allow anyone to SELECT/download files
CREATE POLICY "Anyone can read files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'course-materials'
);
```

---

## Alternative: Use SQL Editor

You can also run all policies at once:

1. Go to **SQL Editor** in Supabase Dashboard
2. Paste this:

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

3. Click **Run**

---

## Verify the Fix

After adding policies, test the upload:

```bash
curl -X POST http://localhost:4000/api/v1/materials \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "type=file" \
  -F "lecture_id=1" \
  -F "file=@test.pdf"
```

You should get a `201 Created` response with the material object.

---

## Why This Happens

-   Supabase Storage has **Row Level Security (RLS)** enabled by default
-   Your backend uses the **service_role** key which bypasses RLS for database tables
-   BUT storage buckets have **separate RLS policies** that must be explicitly configured
-   The policies above allow the service role (authenticated) to upload/delete files

---

## Quick Checklist

-   [ ] Storage bucket `course-materials` exists
-   [ ] Either: Bucket is public (easiest)
-   [ ] OR: RLS policies are created (secure)
-   [ ] Test upload works without errors
-   [ ] Files appear in Supabase Storage dashboard
