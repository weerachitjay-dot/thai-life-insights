-- Create config_tokens table for storing API tokens
CREATE TABLE public.config_tokens (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  token_type TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.config_tokens ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can manage tokens (for now, allow all authenticated users)
CREATE POLICY "Authenticated users can view tokens"
  ON public.config_tokens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tokens"
  ON public.config_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tokens"
  ON public.config_tokens
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tokens"
  ON public.config_tokens
  FOR DELETE
  TO authenticated
  USING (true);