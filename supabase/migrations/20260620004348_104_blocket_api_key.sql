ALTER TABLE dealers ADD COLUMN IF NOT EXISTS blocket_api_key text;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS blocket_store_id text;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS blocket_last_sync timestamptz;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS blocket_sync_enabled boolean DEFAULT false;
