// Shared client-side type for the short language code used by speech,
// word media, and the alphabet activities.
//
// "nl" → Dutch, "en" → English, "ar" → Arabic.
//
// We deliberately keep this separate from Server/API/Language.ts'
// Supported_Language (which uses full names) because these short codes drive
// browser-facing APIs (BCP-47 voice locales, wiki subdomains, etc.).
export type Word_Language = "nl" | "en" | "ar";

// Legacy alias used by Alphabet activities.
export type Lang = Word_Language;
