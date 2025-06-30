-- Enable Row Level Security on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert audit logs
CREATE POLICY "Allow insert for authenticated users"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service_role to insert audit logs
CREATE POLICY "Allow insert for service role"
ON audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow anon users to insert audit logs
CREATE POLICY "Allow insert for anon"
ON audit_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to select audit logs
CREATE POLICY "Allow select for authenticated users"
ON audit_logs
FOR SELECT
TO authenticated
USING (true);

-- Allow service_role to select audit logs
CREATE POLICY "Allow select for service role"
ON audit_logs
FOR SELECT
TO service_role
USING (true); 