-- ═══════════════════════════════════════════════════════════
-- FIX: handle_new_user trigger failing on signup
-- The INSERT policy on profiles requires auth.uid() = id,
-- but auth.uid() isn't available during the trigger execution.
-- Fix: recreate the function with SET search_path and ensure
-- the service_role can insert into profiles.
-- ═══════════════════════════════════════════════════════════

-- 1. Drop and recreate the trigger function with proper settings
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- 2. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Add a policy to allow service_role to insert profiles
-- (the trigger runs as postgres/service_role via SECURITY DEFINER)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4. Also allow service_role full access for admin operations
CREATE POLICY "Service role full access" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Clean up: delete any failed user from the previous test
DELETE FROM auth.users WHERE email = 'test@blueprint-compiler.com';
