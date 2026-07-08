export function mapAuthErrorMessage(message: string, code?: string) {
    const normalized = message.toLowerCase();
    const normalizedCode = code?.toLowerCase() ?? '';

    if (
        normalizedCode === 'over_email_send_rate_limit' ||
        normalized.includes('email rate limit exceeded') ||
        normalized.includes('over_email_send_rate_limit')
    ) {
        return 'Çok fazla mail isteği gönderildi.';
    }

    if (normalized.includes('for security purposes, you can only request this after')) {
        return 'Güvenlik nedeniyle yeni mail isteği için biraz beklemen gerekiyor. Lütfen 1 dakika sonra tekrar dene.';
    }

    return message;
}

const resetCooldownKey = 'planner.reset-email.cooldown';
const resetCooldownMs = 60_000;

export function getResetCooldownRemaining(email: string) {
    try {
        const raw = sessionStorage.getItem(resetCooldownKey);
        if (!raw) {
            return 0;
        }

        const parsed = JSON.parse(raw) as { email?: string; until?: number };
        if (parsed.email?.toLowerCase() !== email.toLowerCase() || !parsed.until) {
            return 0;
        }

        return Math.max(0, parsed.until - Date.now());
    } catch {
        return 0;
    }
}

export function setResetCooldown(email: string) {
    try {
        sessionStorage.setItem(resetCooldownKey, JSON.stringify({
            email: email.toLowerCase(),
            until: Date.now() + resetCooldownMs,
        }));
    } catch {
        // Ignore storage errors.
    }
}
