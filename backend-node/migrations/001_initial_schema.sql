-- Create table for Problems
CREATE TABLE IF NOT EXISTS problems (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    difficulty TEXT,
    category TEXT,
    data JSONB, -- The full JSON object expected by frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Solutions
CREATE TABLE IF NOT EXISTS solutions (
    slug TEXT PRIMARY KEY,
    code TEXT,
    language TEXT,
    data JSONB, -- The full solution object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Stats (Hot Section)
CREATE TABLE IF NOT EXISTS stats (
    slug TEXT PRIMARY KEY,
    views INTEGER DEFAULT 0,
    solves INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching problems
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);

-- Enable Row Level Security (RLS) - Optional but good practice
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Create policies (modify as needed, currently allowing public read)
CREATE POLICY "Public problems are viewable by everyone" ON problems FOR SELECT USING (true);
CREATE POLICY "Public solutions are viewable by everyone" ON solutions FOR SELECT USING (true);
CREATE POLICY "Public stats are viewable by everyone" ON stats FOR SELECT USING (true);

-- Allow service role (anon not recommended for write) to insert/update - users must rely on service_role key or authenticated user
-- For this demo, we assume the backend uses the Service Role Key or has appropriate permissions.
