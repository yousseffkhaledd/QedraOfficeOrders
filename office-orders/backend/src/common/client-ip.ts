import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type Req = {
    socket: { remoteAddress?: string };
    headers: Record<string, string | string[] | undefined>;
};

const normalize = (ip: string) => {
    const v = ip.replace(/^::ffff:/, '');
    return v === '::1' ? '127.0.0.1' : v;
};

/**
 * The IP of the person's computer.
 * Browsers talk to Vite, and Vite forwards to us, so every request *arrives* from
 * 127.0.0.1. Vite adds the real IP as the LAST entry of X-Forwarded-For.
 * We only trust that header when the request comes from this machine (the proxy),
 * and we take the last entry, because anything before it could be typed by the user.
 */
export function clientIp(req: Req): string {
    const socketIp = normalize(req.socket.remoteAddress ?? '');
    const fwd = req.headers['x-forwarded-for'];
    const header = Array.isArray(fwd) ? fwd.join(',') : fwd;
    if (socketIp === '127.0.0.1' && header) {
        const parts = header.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length) return normalize(parts[parts.length - 1]);
    }
    return socketIp;
}

export const ClientIp = createParamDecorator((_: unknown, ctx: ExecutionContext) =>
    clientIp(ctx.switchToHttp().getRequest<Req>()),
);