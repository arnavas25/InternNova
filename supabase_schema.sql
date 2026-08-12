-- Commercial AI Career Hub Schema

CREATE TABLE resumes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id text UNIQUE NOT NULL, -- e.g. INR-A8D4-K92P
  access_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  email text NOT NULL,
  plan text NOT NULL,
  mode text NOT NULL DEFAULT 'Professional',
  resume_type text NOT NULL,
  profile_data jsonb NOT NULL,
  generated_resume jsonb,
  preview_html text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id text NOT NULL,
  razorpay_payment_id text,
  razorpay_signature text,
  plan text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  resume_id text,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE entitlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id text UNIQUE NOT NULL REFERENCES resumes(resume_id),
  plan text NOT NULL,
  features jsonb NOT NULL,
  active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE resume_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id text NOT NULL REFERENCES resumes(resume_id),
  version integer NOT NULL,
  content jsonb NOT NULL,
  source text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Note: We can create an SQL trigger or handle timestamps in the application layer.
