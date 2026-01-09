-- Add service role policies for autonomous chatbot

-- Service role policies for leads
CREATE POLICY "Service role can read all leads"
ON public.leads
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert leads"
ON public.leads
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update leads"
ON public.leads
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Service role can delete leads"
ON public.leads
FOR DELETE
TO service_role
USING (true);

-- Service role policies for accounts
CREATE POLICY "Service role can read all accounts"
ON public.accounts
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert accounts"
ON public.accounts
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update accounts"
ON public.accounts
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Service role can delete accounts"
ON public.accounts
FOR DELETE
TO service_role
USING (true);

-- Service role policies for opportunities
CREATE POLICY "Service role can read all opportunities"
ON public.opportunities
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert opportunities"
ON public.opportunities
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update opportunities"
ON public.opportunities
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Service role can delete opportunities"
ON public.opportunities
FOR DELETE
TO service_role
USING (true);
