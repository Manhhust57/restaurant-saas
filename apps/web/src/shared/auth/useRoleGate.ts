import { useEffect, useState } from 'react';
import { canAccessPath, redirectPathForUnauthorized } from '../../features/auth/roleAccess';
import { loadSession, type Session } from './session';

export function useRoleGate(path: string) {
    const [session, setSession] = useState<Session | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        loadSession().then((value) => {
            if (!cancelled) setSession(value);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!session) return;
        if (!canAccessPath(session.role, path)) {
            window.location.replace(redirectPathForUnauthorized(session.role));
        }
    }, [session, path]);

    return {
        session,
        ready: session !== undefined,
        allowed: Boolean(session && canAccessPath(session.role, path)),
    };
}
