// Partially hides an email address for display, e.g. adam.horvath1723@gmail.com -> ad***@gmail.com.
// Keeps the domain visible (useful context) while hiding the identifying local part.
export function maskEmail(email) {
    const [local, domain] = String(email || '').split('@');
    if (!domain) return email;
    const visible = local.slice(0, 2);
    const hidden = '*'.repeat(Math.max(local.length - visible.length, 3));
    return `${visible}${hidden}@${domain}`;
}
