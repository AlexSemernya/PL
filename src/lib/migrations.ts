// (intentionally empty)
//
// The previous version of this file ran a "wipe demo data once" migration
// gated by a localStorage flag. Problem: in Telegram Desktop, localStorage is
// cleared between sessions, so the flag never persisted — the migration ran
// on every open and silently wiped user data. We've removed it entirely.
//
// New users start with empty stores (no seed data). Existing users keep
// whatever is in their Telegram CloudStorage.
export {}
