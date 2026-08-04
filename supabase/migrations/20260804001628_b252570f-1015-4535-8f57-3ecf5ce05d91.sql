-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,'climber'), '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- papers
CREATE TABLE public.exam_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_library boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  subject text NOT NULL,
  year integer,
  exam_type text NOT NULL DEFAULT 'Past Paper',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_papers TO authenticated;
GRANT ALL ON public.exam_papers TO service_role;
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read library papers" ON public.exam_papers FOR SELECT TO authenticated
  USING (is_library = true OR owner_id = auth.uid());
CREATE POLICY "insert own papers" ON public.exam_papers FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND is_library = false);
CREATE POLICY "update own papers" ON public.exam_papers FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "delete own papers" ON public.exam_papers FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- questions
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  qtype text NOT NULL DEFAULT 'short',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_option integer,
  marks integer NOT NULL DEFAULT 1,
  criteria text,
  exemplar text,
  topic text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_questions TO authenticated;
GRANT ALL ON public.exam_questions TO service_role;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read questions of visible papers" ON public.exam_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exam_papers p WHERE p.id = paper_id AND (p.is_library = true OR p.owner_id = auth.uid())));
CREATE POLICY "write questions of own papers" ON public.exam_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exam_papers p WHERE p.id = paper_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exam_papers p WHERE p.id = paper_id AND p.owner_id = auth.uid()));

-- attempts
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id uuid NOT NULL REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  paper_title text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  awarded_marks numeric NOT NULL DEFAULT 0,
  total_marks numeric NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.exam_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- answers
CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.exam_questions(id) ON DELETE SET NULL,
  question_prompt text NOT NULL DEFAULT '',
  qtype text NOT NULL DEFAULT 'short',
  topic text,
  subject text,
  response text NOT NULL DEFAULT '',
  awarded numeric NOT NULL DEFAULT 0,
  max_marks numeric NOT NULL DEFAULT 1,
  feedback text,
  missing_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  exemplar text,
  is_mistake boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers" ON public.attempt_answers FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_questions_paper ON public.exam_questions(paper_id, position);
CREATE INDEX idx_attempts_user ON public.exam_attempts(user_id, started_at DESC);
CREATE INDEX idx_answers_user ON public.attempt_answers(user_id, is_mistake);

-- ============ SEED LIBRARY PAPERS ============
INSERT INTO public.exam_papers (id, is_library, title, subject, year, exam_type, description) VALUES
('11111111-1111-4111-8111-111111111111', true, 'English Advanced — Paper 1: Texts and Human Experiences', 'English Advanced', 2023, 'HSC Past Paper', 'Unseen texts and a short discursive response. Focus on human experiences, anomalies and paradoxes.'),
('22222222-2222-4222-8222-222222222222', true, 'Mathematics Advanced — Paper 1', 'Mathematics Advanced', 2023, 'HSC Past Paper', 'Multiple choice and short answer across functions, calculus, trigonometry and statistics.'),
('33333333-3333-4333-8333-333333333333', true, 'Biology — Module 5-8 Trial', 'Biology', 2024, 'Trial Paper', 'Heredity, genetic technologies, infectious disease and non-infectious disease and disorders.');

INSERT INTO public.exam_questions (paper_id, position, qtype, prompt, options, correct_option, marks, criteria, exemplar, topic) VALUES
-- English
('11111111-1111-4111-8111-111111111111', 1, 'mcq', 'In a text about human experiences, an "anomaly" is best described as:', '["A repeated motif that reinforces the composer''s message","An inconsistency or deviation from what is expected of human behaviour","A structural device used to order events chronologically","A persuasive appeal to the responder''s emotions"]'::jsonb, 1, 1, 'Correct definition of anomaly in the Texts and Human Experiences rubric.', 'An anomaly is an inconsistency or deviation from expected human behaviour, prompting responders to reconsider assumptions.', 'Human Experiences Rubric'),
('11111111-1111-4111-8111-111111111111', 2, 'short', 'Explain how ONE language technique in an unseen prose extract conveys the emotional impact of an individual human experience. (3 marks)', '[]'::jsonb, NULL, 3, '1 mark: identifies a technique with a valid example. 1 mark: explains the effect of the technique. 1 mark: links the effect explicitly to the emotional impact of an INDIVIDUAL human experience.', 'The extended metaphor of the "closing door" positions the persona''s grief as a physical severance. By rendering an abstract emotion concrete, the composer invites responders into the isolating individual experience of loss, emphasising how memory can imprison rather than comfort.', 'Unseen Texts'),
('11111111-1111-4111-8111-111111111111', 3, 'short', 'Compare how TWO texts represent the tension between collective and individual human experiences. (5 marks)', '[]'::jsonb, NULL, 5, '1-2 marks: describes both texts with limited comparison. 3 marks: compares with some textual evidence. 4-5 marks: sustained, integrated comparison with well-chosen techniques and explicit reference to collective vs individual experience.', 'Both texts stage the friction between belonging and autonomy. Text one uses first-person plural pronouns to construct an inclusive collective voice, whereas text two fractures that unity through fragmented syntax, isolating the individual. Together they suggest collective experience can both sustain and silence the self.', 'Comparative Analysis'),
('11111111-1111-4111-8111-111111111111', 4, 'extended', 'Discursive response: "Storytelling exposes what we would rather not see about ourselves." To what extent does your prescribed text support this view? (20 marks)', '[]'::jsonb, NULL, 20, 'Band 6: skilfully evaluates the statement with a sustained personal voice, integrated textual analysis of form, structure and language, and sophisticated conceptual understanding of human experiences. Band 4: explains the statement with some analysis and adequate textual support. Band 2: describes the text with minimal engagement with the question.', 'A strong response opens with a distinct discursive voice, sustains a conceptual thesis about self-revelation through narrative, weaves 4-6 close textual examples with named techniques, and reflects on the responder''s own confrontation with uncomfortable truths in the conclusion.', 'Extended Response'),
-- Maths
('22222222-2222-4222-8222-222222222222', 1, 'mcq', 'What is the derivative of f(x) = 3x⁴ − 5x² + 7?', '["12x³ − 10x","12x³ − 10x + 7","3x³ − 5x","12x⁴ − 10x²"]'::jsonb, 0, 1, 'Apply the power rule term by term; the constant differentiates to zero.', 'f''(x) = 12x³ − 10x', 'Differentiation'),
('22222222-2222-4222-8222-222222222222', 2, 'mcq', 'The probability of an event is 0.35. What are the odds against the event, in simplest form?', '["7 : 13","13 : 7","35 : 65","1 : 3"]'::jsonb, 1, 1, 'Odds against = P(not A) : P(A) = 0.65 : 0.35 = 13 : 7.', '13 : 7', 'Probability'),
('22222222-2222-4222-8222-222222222222', 3, 'short', 'Find the equation of the tangent to the curve y = x² − 4x + 1 at the point where x = 3. Show all working. (3 marks)', '[]'::jsonb, NULL, 3, '1 mark: correct derivative dy/dx = 2x − 4 and gradient 2. 1 mark: correct point (3, −2). 1 mark: correct tangent equation y = 2x − 8.', 'dy/dx = 2x − 4, so at x = 3 the gradient is 2. When x = 3, y = 9 − 12 + 1 = −2. Using y − y₁ = m(x − x₁): y + 2 = 2(x − 3), therefore y = 2x − 8.', 'Calculus — Tangents'),
('22222222-2222-4222-8222-222222222222', 4, 'short', 'A continuous random variable has a normal distribution with mean 70 and standard deviation 8. Using the empirical rule, find the percentage of scores between 54 and 86. (2 marks)', '[]'::jsonb, NULL, 2, '1 mark: recognises 54 and 86 are 2 standard deviations from the mean. 1 mark: states 95%.', '54 and 86 lie two standard deviations either side of the mean (70 ± 16), so by the empirical rule approximately 95% of scores fall in this interval.', 'Statistical Analysis'),
('22222222-2222-4222-8222-222222222222', 5, 'extended', 'A population of bacteria grows according to P(t) = 500e^(0.12t), where t is in hours. (a) Find the initial population. (b) Find the rate of growth at t = 10 hours. (c) Determine, to the nearest hour, when the population first exceeds 5000. Justify each step. (6 marks)', '[]'::jsonb, NULL, 6, '(a) 1 mark: P(0) = 500. (b) 2 marks: P''(t) = 60e^(0.12t), P''(10) ≈ 199 bacteria/hour. (c) 3 marks: solve 500e^(0.12t) = 5000, t = ln(10)/0.12 ≈ 19.19, so 20 hours (first whole hour exceeding).', '(a) P(0) = 500e⁰ = 500. (b) P''(t) = 500 × 0.12e^(0.12t) = 60e^(0.12t); P''(10) = 60e^1.2 ≈ 199 bacteria per hour. (c) 500e^(0.12t) > 5000 → e^(0.12t) > 10 → t > ln10/0.12 ≈ 19.19, so the population first exceeds 5000 after 20 hours.', 'Exponential Growth'),
-- Biology
('33333333-3333-4333-8333-333333333333', 1, 'mcq', 'Which of the following best describes the role of DNA polymerase during replication?', '["It unwinds the double helix at the origin of replication","It joins Okazaki fragments on the lagging strand","It adds complementary nucleotides to the 3'' end of the growing strand","It removes RNA primers and proofreads the entire genome"]'::jsonb, 2, 1, 'DNA polymerase synthesises in the 5''→3'' direction by adding nucleotides to the free 3''-OH end.', 'DNA polymerase adds complementary nucleotides to the 3'' end of the growing strand.', 'Heredity — DNA Replication'),
('33333333-3333-4333-8333-333333333333', 2, 'short', 'Describe how a vaccine produces long-term immunity in an individual. (4 marks)', '[]'::jsonb, NULL, 4, '1 mark: vaccine introduces antigens (attenuated/inactivated pathogen or mRNA). 1 mark: primary immune response and antibody production by B lymphocytes. 1 mark: formation of memory B and T cells. 1 mark: faster, larger secondary response on re-exposure prevents disease.', 'A vaccine introduces antigens from a pathogen without causing disease. These antigens are presented to B lymphocytes, triggering a primary immune response in which plasma cells secrete specific antibodies. Crucially, memory B and T cells are produced and persist. On re-exposure the memory cells trigger a much faster and larger secondary response, neutralising the pathogen before symptoms develop — conferring long-term immunity.', 'Infectious Disease'),
('33333333-3333-4333-8333-333333333333', 3, 'short', 'Explain ONE ethical issue associated with the use of CRISPR-Cas9 gene editing in humans. (3 marks)', '[]'::jsonb, NULL, 3, '1 mark: identifies a specific ethical issue. 1 mark: explains the biological basis. 1 mark: evaluates implications for individuals or society.', 'Germline editing with CRISPR-Cas9 alters DNA in gametes or embryos, meaning changes are heritable. Because off-target edits may cause unintended mutations that are passed to all future generations, individuals who never consented inherit the risk. This raises concerns about consent, equity of access and a slide toward non-therapeutic "enhancement".', 'Genetic Technologies'),
('33333333-3333-4333-8333-333333333333', 4, 'extended', 'Assess the effectiveness of epidemiological studies in reducing the incidence of ONE non-infectious disease in Australia. (7 marks)', '[]'::jsonb, NULL, 7, '6-7 marks: makes a judgement supported by specific epidemiological data, named study/campaign, and evaluation of limitations. 4-5 marks: describes a study and outcomes with some judgement. 1-3 marks: outlines a study with little or no assessment.', 'Epidemiological studies of lung cancer, notably Doll and Hill''s cohort study, established a strong dose-dependent correlation between smoking and lung cancer incidence. This evidence directly informed Australian public health interventions — plain packaging (2012), tobacco excise increases and Quit campaigns — and daily smoking rates fell from roughly 24% (1991) to under 11% (2022), with lung cancer incidence in males declining accordingly. However, effectiveness is limited: correlation studies cannot alone establish causation, long latency periods delay measurable outcomes, and rising vaping rates may erode gains. Overall, epidemiological studies have been highly effective as the evidentiary basis for policy, though their impact depends on the political will to act on findings.', 'Non-infectious Disease');