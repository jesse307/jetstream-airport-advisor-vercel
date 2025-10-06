-- Create role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Drop existing public write policies on aircraft_operators
DROP POLICY IF EXISTS "Allow public operator insertion" ON public.aircraft_operators;
DROP POLICY IF EXISTS "Allow public operator updates" ON public.aircraft_operators;

-- Create admin-only policies for aircraft_operators
CREATE POLICY "Admins can insert aircraft operators"
ON public.aircraft_operators
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update aircraft operators"
ON public.aircraft_operators
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep public SELECT policy (viewing is still allowed)
-- The existing "Allow public operator viewing" policy remains unchanged