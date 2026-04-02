## Design Context

### Users
Operations managers and team leads tracking performance metrics, resource utilization, and decision intelligence across retail/wholesale channels. They use the dashboard daily to monitor KPIs and make data-driven decisions.

### Brand Personality
Technical precision, restrained confidence, developer-engineered feel. Three words: **precise, restrained, sophisticated**.

### Aesthetic Direction
Vercel/Geist design system — near-pure white canvas (#ffffff) with #171717 text, shadow-as-border technique replacing traditional CSS borders, Geist Sans font with aggressive negative letter-spacing at display sizes. Light-only mode. Multi-layer shadow stacks for depth. Achromatic palette with functional workflow accents only.

### Design Principles
1. **Shadow-as-border**: Never use CSS borders on cards — use `rgba(0,0,0,0.08) 0px 0px 0px 1px` shadow technique
2. **Three-weight typography**: 400 (body), 500 (UI/interactive), 600 (headings) — no bold/700
3. **Compressed text, expanded space**: Aggressive negative tracking on headlines, generous whitespace
4. **Ligatures enabled**: `font-feature-settings: "liga"` on all Geist text
5. **Color is functional**: Achromatic grays from #171717 to #ffffff are the system; workflow accents only in context

### Key Design Tokens
- Primary text: #171717 (Vercel Black)
- Background: #ffffff (Pure White)
- Body text: #4d4d4d (Gray 600)
- Muted text: #666666 (Gray 500)
- Dividers: #ebebeb (Gray 100)
- Surface: #fafafa (Gray 50)
- Focus ring: hsla(212, 100%, 48%, 1)
- Card shadow stack: `rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px`
- Badge blue bg: #ebf5ff, text: #0068d6
