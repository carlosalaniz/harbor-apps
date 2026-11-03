// Harbor: the browser's taps, keys and typed text as hardware input (images/ws-scrcpy/harbor-input.c runs inside
// Android). Some apps ignore input Android marks as coming from a virtual device, which is what scrcpy injects
// (WhatsApp's registration screen). With HARBOR_INPUT=<host>:<port> set, the stream proxy hands scrcpy's touch, key
// and text control messages to the harbor-input daemon instead; anything it cannot express (Back, Home, Power,
// non-ASCII text) and everything while the daemon is not reachable still goes to scrcpy as before.
import * as net from 'net';

const TYPE_KEYCODE = 0;
const TYPE_TEXT = 1;
const TYPE_TOUCH = 2;
const AXIS = 32767;

// Android KeyEvent keycode -> Linux input key code (the keys a text field needs; navigation keys stay with scrcpy)
const KEYS: Record<number, number> = {
    7: 11, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, // 0-9
    29: 30, 30: 48, 31: 46, 32: 32, 33: 18, 34: 33, 35: 34, 36: 35, 37: 23, 38: 36, 39: 37, 40: 38, 41: 50, // a-m
    42: 49, 43: 24, 44: 25, 45: 16, 46: 19, 47: 31, 48: 20, 49: 22, 50: 47, 51: 17, 52: 45, 53: 21, 54: 44, // n-z
    55: 51, 56: 52, 57: 56, 58: 100, 59: 42, 60: 54, 61: 15, 62: 57, 66: 28, 67: 14, 68: 41, 69: 12, 70: 13,
    71: 26, 72: 27, 73: 43, 74: 39, 75: 40, 76: 53, 19: 103, 20: 108, 21: 105, 22: 106, 92: 104, 93: 109,
    111: 1, 112: 111, 113: 29, 114: 97, 115: 58, 122: 102, 123: 107, 124: 110,
};
const SHIFT = 42;
// US layout: printable ASCII -> [Linux key code, shifted]
const CHARS: Record<string, [number, boolean]> = (() => {
    const m: Record<string, [number, boolean]> = {};
    const row = (keys: string, shifted: string, codes: number[]) =>
        codes.forEach((c, i) => {
            m[keys[i]] = [c, false];
            m[shifted[i]] = [c, true];
        });
    row('1234567890-=', '!@#$%^&*()_+', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    row('qwertyuiop[]', 'QWERTYUIOP{}', [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]);
    row("asdfghjkl;'`", 'ASDFGHJKL:"~', [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41]);
    row('\\zxcvbnm,./', '|ZXCVBNM<>?', [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53]);
    m[' '] = [57, false];
    m['\n'] = [28, false];
    m['\t'] = [15, false];
    return m;
})();

export class HarborInput {
    private socket?: net.Socket;
    private ready = false;
    private slots = new Map<string, number>();

    public static fromEnv(): HarborInput | undefined {
        const target = process.env.HARBOR_INPUT;
        if (!target) {
            return;
        }
        const [host, port] = target.split(':');
        return new HarborInput(host, Number(port) || 7008);
    }

    private constructor(private readonly host: string, private readonly port: number) {
        this.connect();
    }

    private connect(): void {
        const socket = net.connect(this.port, this.host);
        socket.setNoDelay(true);
        socket.on('connect', () => (this.ready = true));
        socket.on('error', () => (this.ready = false));
        socket.on('close', () => {
            this.ready = false;
            this.slots.clear();
        });
        this.socket = socket;
    }

    private send(lines: string[]): boolean {
        if (!this.ready || !this.socket) {
            if (this.socket?.destroyed) {
                this.connect(); // the daemon may have started since; the next message uses it
            }
            return false;
        }
        this.socket.write(lines.join('\n') + '\n');
        return true;
    }

    // true = consumed (sent as hardware input); false = forward to scrcpy unchanged
    public handle(data: unknown): boolean {
        if (!Buffer.isBuffer(data) || data.length < 1) {
            return false;
        }
        switch (data[0]) {
            case TYPE_TOUCH:
                return data.length === 29 && this.touch(data);
            case TYPE_KEYCODE:
                return data.length === 14 && this.key(data);
            case TYPE_TEXT:
                return data.length >= 5 && this.text(data);
            default:
                return false;
        }
    }

    private touch(b: Buffer): boolean {
        const action = b.readUInt8(1);
        const pointer = `${b.readUInt32BE(2)}:${b.readUInt32BE(6)}`;
        const w = Math.max(2, b.readUInt16BE(18));
        const h = Math.max(2, b.readUInt16BE(20));
        const x = Math.min(AXIS, Math.max(0, Math.round((b.readUInt32BE(10) * AXIS) / (w - 1))));
        const y = Math.min(AXIS, Math.max(0, Math.round((b.readUInt32BE(14) * AXIS) / (h - 1))));
        let slot = this.slots.get(pointer);
        if (action === 0 || action === 5) {
            if (slot === undefined) {
                const used: boolean[] = [];
                this.slots.forEach((s) => (used[s] = true));
                for (let s = 0; s < 10 && slot === undefined; s++) {
                    if (!used[s]) slot = s;
                }
                if (slot === undefined) {
                    return true; // more than ten fingers: drop it
                }
                this.slots.set(pointer, slot);
            }
            return this.send([`d ${slot} ${x} ${y}`]);
        }
        if (action === 2) {
            // a mouse moving without a button down is no touch at all
            return slot === undefined ? true : this.send([`m ${slot} ${x} ${y}`]);
        }
        if (action === 1 || action === 3 || action === 6) {
            if (slot === undefined) {
                return true;
            }
            this.slots.delete(pointer);
            return this.send([`u ${slot}`]);
        }
        return false;
    }

    private key(b: Buffer): boolean {
        const action = b.readInt8(1);
        const code = KEYS[b.readInt32BE(2)];
        const repeat = b.readInt32BE(6);
        if (code === undefined || (action !== 0 && action !== 1)) {
            return false;
        }
        if (repeat > 0) {
            return true; // Android repeats a held hardware key itself
        }
        return this.send([`k ${code} ${action === 0 ? 1 : 0}`]);
    }

    private text(b: Buffer): boolean {
        const length = b.readUInt32BE(1);
        const text = b.subarray(5, 5 + length).toString('utf8');
        const keys = Array.from(text).map((c) => CHARS[c]);
        if (keys.some((k) => k === undefined)) {
            return false; // not plain ASCII: scrcpy types it
        }
        const lines: string[] = [];
        for (const [code, shifted] of keys as [number, boolean][]) {
            if (shifted) lines.push(`k ${SHIFT} 1`);
            lines.push(`k ${code} 1`, `k ${code} 0`);
            if (shifted) lines.push(`k ${SHIFT} 0`);
        }
        return this.send(lines);
    }

    public release(): void {
        this.socket?.destroy();
        this.socket = undefined;
    }
}
