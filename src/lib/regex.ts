export const RE_EMOJI = /:([a-zA-Z0-9\-_]+):/g;
export const RE_ULID = /[0-9A-Z]{26}/g;
export const RE_MENTION = new RegExp(`<@(${RE_ULID.source})>`, 'g');
export const RE_CHANNEL = new RegExp(`<#(${RE_ULID.source})>`, 'g');
