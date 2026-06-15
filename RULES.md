# Onyx Stream - Project Rules & Context

This document serves as the "brain" for AI agents working on this repository. Whenever starting a new session, instruct the AI to read this file first.

## 🎨 Design System & Aesthetics
- **Strict Glassmorphism**: The UI must look ultra-premium. Use heavily blurred backdrops (`backdrop-filter: blur(16px)`), subtle white borders (`rgba(255, 255, 255, 0.08)`), and soft glowing shadows.
- **Dynamic Ambient Lighting**: The UI dynamically recolors itself to match the dominant color of whatever movie poster is active. Fallback brand color is Purple (`#8b5cf6`).
- **Smooth Animations**: 
  - CSS transitions should use the custom bezier curve: `cubic-bezier(0.16, 1, 0.3, 1)`.
  - React component mounting/unmounting animations must use `framer-motion`.

## 💻 Tech Stack & CSS Rules
- **No TailwindCSS**: Write pure, vanilla CSS in `index.css`.
- **CSS Variables Only**: Do not hardcode colors in components. Map everything to CSS variables in `:root` (e.g., `var(--glass-bg)`, `var(--primary-alpha-40)`).
- **8-Digit Hex Over RGBA**: Never use `rgba()`. All transparent colors must be calculated as 8-digit hex values (e.g., `#ffffff1a` instead of `rgba(255, 255, 255, 0.1)`).
- **Avoid Layout Twitches**: Elements like inputs and buttons must not change physical dimensions on hover. Lock `height`, `margin`, and `border-width` strictly using `!important` if necessary to prevent subpixel layout shifts.
- **Autofill Handling**: Chrome autofill overrides CSS violently. Always use explicit `font-family: system-ui` for password fields to keep dot sizing consistent, and use the `transition: background-color 5000s` hack to preserve glassmorphism on autofilled inputs.

## 🚀 Scroll Performance & Layout Shifts
- **Backdrop-Filter Bottlenecks**: Never nest GPU accelerated layers (`transform: translateZ(0)`) or elements with changing `opacity` under a heavy `backdrop-filter: blur()`. It forces Chromium to fall back to software rendering and destroys scrolling framerates. Rely on hardware-accelerated translucent gradients (e.g., `.liquid-panel`) for scroll-heavy overlays instead.
- **Scroll-Hover Jank**: Scrolling rapidly across lists of complex items (with heavy `:hover` effects like `scale` or multi-layered `box-shadow`) triggers massive GPU paint storms. Always attach a React `onScroll` listener to temporarily apply `pointer-events: none` to the scrollable container, reactivating it via `setTimeout` when scrolling stops.
- **Scrollbar Layout Shifts**: Hiding the body scrollbar (`overflow: hidden`) to lock background scrolling causes immediate layout shifts. Mitigate this by dynamically calculating the active scroll container's scrollbar width (`element.offsetWidth - element.clientWidth`) and applying it as `padding-right` before freezing the overflow.
- **Passive Scroll Listeners**: Never attach non-passive `onWheel` or `onTouchMove` event listeners in React purely to call `e.stopPropagation()`. They pause the browser's hardware scroll compositor thread and induce severe scrolling latency.
- **Modal Scroll Locking & Portals**: When rendering fixed full-screen overlays (modals), do not rely purely on `overflow: hidden` on the body if the modal is nested within layout wrappers (like framer-motion containers) which can trap `position: fixed`. Always use `createPortal(<Modal />, document.body)` to beam the overlay out of its container. For the scroll lock itself, set the portal wrapper to `position: fixed, inset: 0, overflow-y: auto, overscroll-behavior: contain`. This physically traps scroll momentum inside the modal wrapper without requiring any JavaScript scroll listeners or `body.overflow` hacks that cause layout twitches.

## 🎛️ UI Elements & Buttons
- **Liquid Buttons**: All interactive buttons MUST use the `liquid-button` CSS class to ensure they inherit the dynamic animated gradient hover effects and glassy aesthetic.
- **Danger States**: Destructive actions (Dismiss, Delete, Sign Out) must use the `.danger-liquid-button` class (or `.logout-btn`) which inherits the liquid glass aesthetic but uses a red tint (`--error-color`) and specific hover mechanics (`transform: translateY(-2px)`).
- **Disabled States**: Disabled buttons should not just use HTML `disabled`. They must use inline React styles `pointerEvents: 'none'` to completely strip the element of hover physics (glow, transform) while in an inactive state, along with `opacity: 0.5`.

## 🔌 Architecture
- **Frontend**: React (Vite, TypeScript, React Router).
- **Backend**: Express/Node.js running on `http://localhost:4000`.
- **API Strategy**: The frontend communicates via JWT Bearer tokens. Proxy logic or direct fetching is handled via standard `fetch()` or simple utilities.

## 📝 Licensing & Headers
- **AGPLv3 Compliance**: This project is strictly licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
- **Mandatory File Headers**: Every single `.js`, `.ts`, and `.tsx` file (both frontend and backend) MUST include the full 15-line AGPLv3 copyright header block at the absolute top of the file.
- **Header Formatting**: The header must start with `/*` and end with `*/`. There MUST be exactly one blank line after the `*/` before any import statements or code begins. Do not remove or alter existing headers.