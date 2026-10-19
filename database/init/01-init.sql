-- ==============================================================================
-- Open Quiz Platform - Database Initialization Script
-- ==============================================================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for fuzzy text and title search indexing
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
