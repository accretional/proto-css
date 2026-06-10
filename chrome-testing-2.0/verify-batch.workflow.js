export const meta = {
  name: 'verify-batch',
  description: 'Verify a specific batch of property screenshots for correctness + distinctness',
  phases: [{ title: 'Verify', detail: 'one agent per property in the batch' }],
}

const SHOTS = 'chrome-testing-2.0/screenshots'

const VERDICT = {
  type: 'object',
  properties: {
    property: { type: 'string' },
    category: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
    distinct: { type: 'boolean' },
    correct: { type: 'boolean' },
    note: { type: 'string', description: 'one concise sentence' },
    problemValues: { type: 'array', items: { type: 'string' } },
  },
  required: ['property', 'category', 'distinct', 'correct', 'note'],
}

const verifyPrompt = (name) => `Visually verify the gallery screenshots for the CSS property "${name}".

Layout of ${SHOTS}/${name}/ :
- STATIC values: single files NN-<value>.png.
- TEMPORAL values (animation/transition/scroll/pointer-events): a FOLDER NN-<value>/ with
  frame-00.png … (read the frame PNGs, not the .gif — a gif reads as one frame).

Steps:
1. ls -1 ${SHOTS}/${name}/ (and ls any subfolders).
2. READ the screenshots with your vision (all if ≤12 values; else an evenly-spaced ~12).
3. Judge by eye:
   - CORRECT: does the demo visibly reflect each value? (e.g. border-left-color=blue → a blue
     left edge; padding=48px → clearly larger inset than 8px; text-transform=uppercase → UPPER text)
   - DISTINCT: do different values look visibly DIFFERENT from each other?
4. Category: A = correct AND distinct; B = applied but demos look identical across values;
   C = broken/empty/wrong; D = genuinely uncapturable in a headless still (cursor shape, caret,
   text selection). Be strict — only A if you SEE distinct correct renders.
5. Return the verdict; note = ONE sentence; list up to 5 problemValues (filenames) that are wrong
   or identical.`

phase('Verify')
let raw = args
if (typeof raw === 'string') raw = raw.split(',')
else if (raw && !Array.isArray(raw) && Array.isArray(raw.props)) raw = raw.props
else if (raw && !Array.isArray(raw) && Array.isArray(raw.properties)) raw = raw.properties
const props = (Array.isArray(raw) ? raw : []).map((s) => String(s).trim()).filter(Boolean)
log(`Verifying batch of ${props.length} properties`)
const verdicts = await pipeline(
  props,
  (name) => agent(verifyPrompt(name), { label: `verify:${name}`, phase: 'Verify', schema: VERDICT }),
)
return { verdicts: verdicts.filter(Boolean) }
