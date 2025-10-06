-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add user_id to leads table
ALTER TABLE public.leads ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing leads to have a user_id (set to null for now, will be handled by app)
-- New leads will require user_id

-- Drop old public RLS policies on leads
DROP POLICY IF EXISTS "Allow public lead creation" ON public.leads;
DROP POLICY IF EXISTS "Allow public lead updates" ON public.leads;
DROP POLICY IF EXISTS "Allow public lead viewing" ON public.leads;

-- Create user-specific RLS policies for leads
CREATE POLICY "Users can view their own leads"
  ON public.leads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add user_id to email_templates
ALTER TABLE public.email_templates ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old public policies on email_templates
DROP POLICY IF EXISTS "Allow public template creation" ON public.email_templates;
DROP POLICY IF EXISTS "Allow public template updates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow public template viewing" ON public.email_templates;

-- Create user-specific RLS policies for email_templates
CREATE POLICY "Users can view their own templates"
  ON public.email_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.email_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.email_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.email_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add user_id to webhook_logs
ALTER TABLE public.webhook_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old policies on webhook_logs
DROP POLICY IF EXISTS "Allow public webhook log creation" ON public.webhook_logs;
DROP POLICY IF EXISTS "Allow public webhook log viewing" ON public.webhook_logs;

-- Create user-specific policies for webhook_logs
CREATE POLICY "Users can view their own webhook logs"
  ON public.webhook_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook logs"
  ON public.webhook_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add user_id to pending_lead_imports
ALTER TABLE public.pending_lead_imports ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old policies
DROP POLICY IF EXISTS "Allow public insertion of pending imports" ON public.pending_lead_imports;
DROP POLICY IF EXISTS "Allow public update of pending imports" ON public.pending_lead_imports;
DROP POLICY IF EXISTS "Allow public viewing of pending imports" ON public.pending_lead_imports;

-- Create user-specific policies
CREATE POLICY "Users can view their own pending imports"
  ON public.pending_lead_imports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending imports"
  ON public.pending_lead_imports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending imports"
  ON public.pending_lead_imports
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();