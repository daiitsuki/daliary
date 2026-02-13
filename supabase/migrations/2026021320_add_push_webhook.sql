-- Enable the pg_net extension to allow HTTP requests from the database
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Function to call the Vercel push API
CREATE OR REPLACE FUNCTION public.request_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Perform an asynchronous HTTP POST request to the Vercel API
  -- TODO: Replace 'https://daliary.vercel.app' with your actual Vercel deployment URL
  PERFORM
    net.http_post(
      url := 'https://daliary.vercel.app/api/push', 
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new notification is inserted
DROP TRIGGER IF EXISTS tr_request_push_notification ON public.notifications;
CREATE TRIGGER tr_request_push_notification
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE PROCEDURE public.request_push_notification();
