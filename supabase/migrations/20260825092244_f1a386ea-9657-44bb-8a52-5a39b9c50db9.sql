CREATE TABLE public.recall_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📘',
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.recall_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.recall_subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.recall_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.recall_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.recall_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID REFERENCES public.recall_subjects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.recall_folders(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX recall_folders_subject_idx ON public.recall_folders(subject_id);
CREATE INDEX recall_materials_folder_idx ON public.recall_materials(folder_id);
CREATE INDEX recall_sessions_folder_idx ON public.recall_sessions(folder_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recall_subjects TO authenticated;
GRANT ALL ON public.recall_subjects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recall_folders TO authenticated;
GRANT ALL ON public.recall_folders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recall_materials TO authenticated;
GRANT ALL ON public.recall_materials TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recall_sessions TO authenticated;
GRANT ALL ON public.recall_sessions TO service_role;

ALTER TABLE public.recall_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own recall subjects" ON public.recall_subjects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own recall folders" ON public.recall_folders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own recall materials" ON public.recall_materials FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own recall sessions" ON public.recall_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);