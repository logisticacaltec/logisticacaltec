
CREATE OR REPLACE FUNCTION public.enforce_allowed_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed TEXT[] := ARRAY[
    'kelvin.vicente@caltec.com.br',
    'robson.melo@caltec.com.br',
    'toniel.ramos@caltec.com.br',
    'joao.rigueiral@caltec.com.br',
    'guilherme.selinski@caltec.com.br'
  ];
BEGIN
  IF NEW.email IS NULL OR NOT (lower(NEW.email) = ANY (allowed)) THEN
    RAISE EXCEPTION 'E-mail não autorizado. Solicite acesso ao administrador.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_allowed_email_trigger ON auth.users;
CREATE TRIGGER enforce_allowed_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email();
