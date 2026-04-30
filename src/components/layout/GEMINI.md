# UI/UX & Layout Standards

## 1. Design System: Glassmorphism (Apple Style)
- **Background**: `bg-gradient-to-b from-white/40 to-white/10` + `backdrop-blur-[32px]`.
- **Border**: `border-white/50`.
- **Depth**: `shadow-[0_20px_50px_rgba(0,0,0,0.1)]` + `shadow-[0_1px_2px_rgba(255,255,255,0.5)_inset]`.

## 2. Responsive Strategy: iPadOS Dock Style (BottomNav)
- **Mobile**: Icon + 9px text.
- **Desktop (md+)**: Hide text, scale icons (`w-7 h-7`), hover scale-up effect.

## 3. Layout & Spacing
- **Bottom Padding**: Scrolled content must have `pb-24`.
- **Fixed Elements**: Must have `bottom-24` to avoid overlapping BottomNav.

## 4. Modal Standards
- **Design**: White/90 backdrop-blur-xl container.
- **Mobile**: Slides up from bottom (`y: "100%"` to `y: 0`).
- **Desktop**: Fade/Scale in.
- **Features**: Backdrop blur (`bg-black/40`), back button support (history state).
