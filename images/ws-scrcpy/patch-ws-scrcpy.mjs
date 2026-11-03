// Wires HarborInput into ws-scrcpy's stream proxy (run in the build stage, from the ws-scrcpy checkout). Every
// replacement must apply exactly once: a moved upstream fails the image build instead of shipping without it.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const file = 'src/server/mw/WebsocketProxy.ts';
let s = readFileSync(file, 'utf8');
const edits = [
  ["import { Multiplexer } from '../../packages/multiplexer/Multiplexer';\n", "import { Multiplexer } from '../../packages/multiplexer/Multiplexer';\nimport { HarborInput } from './HarborInput';\n"],
  ['    private storage: WS.MessageEvent[] = [];\n', '    private storage: WS.MessageEvent[] = [];\n    private harborInput = HarborInput.fromEnv();\n'],
  ['    protected onSocketMessage(event: WS.MessageEvent): void {\n', '    protected onSocketMessage(event: WS.MessageEvent): void {\n        if (this.harborInput && this.harborInput.handle(event.data)) {\n            return;\n        }\n'],
  ['        super.release();\n        this.released = true;\n', '        super.release();\n        this.released = true;\n        if (this.harborInput) {\n            this.harborInput.release();\n        }\n'],
];
for (const [from, to] of edits) {
  if (s.split(from).length !== 2) throw new Error(`${file}: expected exactly one ${JSON.stringify(from.slice(0, 60))}`);
  s = s.replace(from, to);
}
writeFileSync(file, s);
copyFileSync(process.argv[2], 'src/server/mw/HarborInput.ts');
console.log('ws-scrcpy: stream proxy hands touch/key/text to harbor-input when HARBOR_INPUT is set');
