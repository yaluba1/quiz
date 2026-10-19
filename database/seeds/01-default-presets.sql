-- ==============================================================================
-- Open Quiz Platform - Seed Data: System Theme Presets
-- ==============================================================================

INSERT INTO themes (
    id,
    professor_id,
    name,
    is_system_preset,
    logo_url,
    primary_color,
    secondary_color,
    background_color,
    font_family,
    custom_css_vars,
    created_at
) VALUES
-- 1. Pistachio & Pumpkin (Default Platform Theme)
(
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Pistachio & Pumpkin',
    true,
    NULL,
    '#93C572',
    '#FF7518',
    '#F7F9F6',
    'Inter',
    '{"--theme-accent": "#4A7C59", "--theme-card-bg": "#FFFFFF"}'::jsonb,
    NOW()
),
-- 2. Academic Classic (Deep Blue & Teal)
(
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'Academic Classic',
    true,
    NULL,
    '#2563EB',
    '#0D9488',
    '#F8FAFC',
    'Poppins',
    '{"--theme-accent": "#1E40AF", "--theme-card-bg": "#FFFFFF"}'::jsonb,
    NOW()
),
-- 3. Cyber Neon (Dark Gamified Theme)
(
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'Cyber Neon',
    true,
    NULL,
    '#06B6D4',
    '#F43F5E',
    '#0F172A',
    'JetBrains Mono',
    '{"--theme-accent": "#38BDF8", "--theme-card-bg": "#1E293B"}'::jsonb,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    background_color = EXCLUDED.background_color,
    font_family = EXCLUDED.font_family,
    custom_css_vars = EXCLUDED.custom_css_vars;

