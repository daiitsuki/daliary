-- 1. Add restrictive SELECT policies for storage.objects
-- Since public SELECT policies were dropped to prevent listing all objects,
-- we need to allow users to SELECT their own objects so that INSERT ... RETURNING (which is used during file upload) succeeds.

CREATE POLICY "Users can view their own diary images"
ON storage.objects FOR SELECT TO authenticated
USING ( bucket_id = 'diary-images' AND auth.uid() = owner );

CREATE POLICY "Users can view their own visit photos"
ON storage.objects FOR SELECT TO authenticated
USING ( bucket_id = 'visit-photos' AND auth.uid() = owner );
