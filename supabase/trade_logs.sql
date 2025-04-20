-- Create the trade_logs table in Supabase
CREATE TABLE IF NOT EXISTS public.trade_logs (
    id BIGSERIAL PRIMARY KEY,
    ticker TEXT NOT NULL,
    action TEXT NOT NULL,
    price NUMERIC,
    quantity NUMERIC NOT NULL,
    trade_id TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS trade_logs_ticker_idx ON public.trade_logs (ticker);
CREATE INDEX IF NOT EXISTS trade_logs_status_idx ON public.trade_logs (status);
CREATE INDEX IF NOT EXISTS trade_logs_created_at_idx ON public.trade_logs (created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trade_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON public.trade_logs 
FOR ALL 
TO authenticated 
USING (true);

-- Comment on table
COMMENT ON TABLE public.trade_logs IS 'Logs of trades executed via TradingView webhooks';
