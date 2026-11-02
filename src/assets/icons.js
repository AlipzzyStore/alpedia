// Full set ikon SVG custom ALPEDIA (bukan emoji sistem/Android/iOS)
export const ICON_SPRITE = `
<svg width="0" height="0" style="position:absolute">
<defs>
<symbol id="ic-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></symbol>
<symbol id="ic-unlock" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-2.6"/></symbol>
<symbol id="ic-download" viewBox="0 0 24 24"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 20h16"/></symbol>
<symbol id="ic-hd" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9v6M11 9v6M7 12h4M14 9h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3z"/></symbol>
<symbol id="ic-scissors" viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.5 12 20 20M8.5 12 4 15"/></symbol>
<symbol id="ic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-5-5"/></symbol>
<symbol id="ic-shield" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="ic-bot" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></symbol>
<symbol id="ic-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></symbol>
<symbol id="ic-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3-7-2 2M7 17l-2 2m14 0-2-2M7 7 5 5"/></symbol>
<symbol id="ic-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>
<symbol id="ic-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></symbol>
<symbol id="ic-phone" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z"/></symbol>
<symbol id="ic-maint" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3-7-2 2M7 17l-2 2m14 0-2-2M7 7 5 5"/></symbol>
<symbol id="ic-ban" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m5 5 14 14"/></symbol>
<symbol id="ic-megaphone" viewBox="0 0 24 24"><path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V9l-3 5H5a2 2 0 0 0-2-2zM14 6v12a8 8 0 0 0 4-7V9a8 8 0 0 0-4-3z"/></symbol>
<symbol id="ic-eye" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="ic-activity" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></symbol>
<symbol id="ic-chat" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></symbol>
<symbol id="ic-upload" viewBox="0 0 24 24"><path d="M12 21V9m0 0 4 4m-4-4-4 4M4 4h16"/></symbol>
<symbol id="ic-key" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m10.5 12.5 9-9M16 6l2 2M19 3l2 2"/></symbol>
</defs></svg>`;
export const icon = (name, cls = "icon") => `<svg class="${cls}"><use href="#ic-${name}"/></svg>`;
