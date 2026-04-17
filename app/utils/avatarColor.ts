const AVATAR_COLORS = [
    "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
    "#d97706", "#059669", "#0891b2", "#0284c7",
    "#4338ca", "#9333ea", "#c026d3", "#e11d48",
];

export function getAvatarColor(name: string): string {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getAvatarInitials(name: string): string {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
}
