-- Migration: Add foto_url to anamneses table
-- Date: 2026-03-03
-- Purpose: Store the URL of a personal photo for the anamnesis record

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'foto_url'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN foto_url TEXT;
        COMMENT ON COLUMN anamneses.foto_url IS 'URL da foto pessoal do usuário para a ficha de anamnese';
    END IF;
END $$;
