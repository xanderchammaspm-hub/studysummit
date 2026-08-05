-- Profile gamification fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS cosmetics jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Synced app state (autosave)
CREATE TABLE IF NOT EXISTS public.user_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_state TO authenticated;
GRANT ALL ON public.user_state TO service_role;
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own state" ON public.user_state;
CREATE POLICY "own state" ON public.user_state FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS user_state_set_updated_at ON public.user_state;
CREATE TRIGGER user_state_set_updated_at BEFORE UPDATE ON public.user_state
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Upcoming exams countdown
CREATE TABLE IF NOT EXISTS public.user_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL DEFAULT '',
  exam_date date NOT NULL,
  color text NOT NULL DEFAULT '#a855f7',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_exams TO authenticated;
GRANT ALL ON public.user_exams TO service_role;
ALTER TABLE public.user_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own exams" ON public.user_exams;
CREATE POLICY "own exams" ON public.user_exams FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS user_exams_set_updated_at ON public.user_exams;
CREATE TRIGGER user_exams_set_updated_at BEFORE UPDATE ON public.user_exams
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own achievements" ON public.user_achievements;
CREATE POLICY "own achievements" ON public.user_achievements FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- XP ledger
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own xp read" ON public.xp_events;
CREATE POLICY "own xp read" ON public.xp_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "own xp insert" ON public.xp_events;
CREATE POLICY "own xp insert" ON public.xp_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Keep profile XP/coins in sync with the ledger
CREATE OR REPLACE FUNCTION public.apply_xp_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET xp = GREATEST(0, xp + NEW.amount),
         coins = GREATEST(0, coins + GREATEST(0, NEW.amount) / 10)
   WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS xp_events_apply ON public.xp_events;
CREATE TRIGGER xp_events_apply AFTER INSERT ON public.xp_events
FOR EACH ROW EXECUTE FUNCTION public.apply_xp_event();

REVOKE EXECUTE ON FUNCTION public.apply_xp_event() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;

-- Realtime for cross-device autosave
ALTER TABLE public.user_state REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_state;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Avatars bucket policies (bucket created separately)
DROP POLICY IF EXISTS "avatar read own" ON storage.objects;
CREATE POLICY "avatar read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatar write own" ON storage.objects;
CREATE POLICY "avatar write own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatar update own" ON storage.objects;
CREATE POLICY "avatar update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatar delete own" ON storage.objects;
CREATE POLICY "avatar delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);