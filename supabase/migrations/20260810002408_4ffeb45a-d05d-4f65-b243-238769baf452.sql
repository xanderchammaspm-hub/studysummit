ALTER TABLE public.exam_papers ADD COLUMN IF NOT EXISTS file_path text;

CREATE POLICY "Users read own exam paper files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exam-papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own exam paper files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exam-papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own exam paper files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exam-papers' AND auth.uid()::text = (storage.foldername(name))[1]);