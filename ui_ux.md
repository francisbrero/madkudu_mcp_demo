# 🎨 UI/UX Design Brief – MadKudu MCP Demo App

## 👤 Audience

- RevOps, Marketing Ops, and Sales Ops leaders at PLG companies
- Internal MadKudu team and investors evaluating the platform shift
- Design-conscious technical decision-makers

---

## 🎯 Design Goals

- Visually convey how MadKudu’s context elevates agent performance
- Maintain clarity and simplicity — avoid marketing polish or gimmicks
- Feel like a real, usable interface — trustworthy and elegant
- Match **MadKudu’s visual identity** (see Design System reference)

---

## 🧱 Functional Requirements

### Layout

- **Two vertical panels (side-by-side)**:
  - Left: GPT-only output
  - Right: GPT + MadKudu context-enhanced output
  - Each panel should include:
    - Chat bubble stream
    - Agent label and icon (optional)
    - Output formatting (Markdown with headings, bullets, bold)

- **Agent Selector** (top bar or dropdown):
  - Switch between:
    - Executive Outreach Agent
    - Account Plan Generator
    - TBD third agent
  - Input field changes based on agent selected

- **Input Section**:
  - Dynamic placeholder based on agent
  - Support email input (for outreach) or domain input (for account plan)

### Optional (Stretch Goals)
- Toggle to preview injected context
- Diff view to show how GPT-only vs. context-based answers differ

---

## 🎨 Visual Design System

### 🟣 MadKudu Theme Requirements

- **Fonts**: Inter or system UI (fallback: sans-serif)
- **Primary Color**: `#6C63FF` (MadKudu purple)
- **Secondary/Accent**: Shades of indigo and slate (light + dark variants)
- **Background**: White/light-gray or very dark gray (dark mode toggle optional)
- **Button / Chip Styling**: Follow MadKudu UI kit
- **Use of Icons**: Minimal, clear, not playful
- **Logo**: Use /public/madkudu_logo.svg

You may reference internal MadKudu components from our marketing site, dashboard, and demo environments.

---

## 🖼️ Design Deliverables

- Figma file including:
  - Full-screen view (desktop-first)
  - Chat layout
  - Agent switching UI
  - Input components
  - Design tokens (colors, type, spacing)
- Optional: Light/dark theme toggle
- Notes for developers (padding, variants, etc.)

---

## 📌 Style Inspiration

- [Cursor.so](https://cursor.so)
- [Notion AI](https://notion.so/product/ai)
- [Linear.app](https://linear.app)
- MadKudu's product UI (data-rich, professional)
