# Daliary Project Guidelines for Gemini

이 문서는 Daliary 프로젝트의 디자인 철학, 코드 컨벤션 및 UI/UX 원칙을 정의합니다. Gemini는 향후 모든 수정 및 기능 추가 시 이 가이드를 최우선으로 참고해야 합니다.

## 1. Design System: Glassmorphism (Apple Style)

프로젝트의 핵심 UI 요소(특히 네비게이션 및 플로팅 요소)는 Apple의 Glassmorphism 스타일을 따릅니다.

- **Background**: `bg-gradient-to-b from-white/40 to-white/10`와 `backdrop-blur-[32px]`를 조합하여 투명한 유리 질감을 구현합니다.
- **Border**: `border-white/50`을 사용하여 가늘고 밝은 테두리를 적용합니다.
- **Depth**: 깊은 그림자(`shadow-[0_20px_50px_rgba(0,0,0,0.1)]`)와 안쪽 반사광(`shadow-[0_1px_2px_rgba(255,255,255,0.5)_inset]`)을 사용하여 입체감을 부여합니다.
- **Active State**: 활성화된 요소는 `bg-white/40`과 미세한 안쪽 그림자를 가진 유리 캡슐 형태로 표현합니다.

## 2. Responsive Strategy: iPadOS Dock Style

하단 네비게이션(`BottomNav`)은 기기에 따라 인터페이스가 가변적으로 변해야 합니다.

- **Mobile**: 콤팩트한 사이즈, 아이콘 + 9px 텍스트 레이블 표시.
- **Desktop (md 이상)**: iPadOS Dock 스타일 적용.
    - 텍스트 레이블 숨김.
    - 아이콘 크기 확대 (`w-7 h-7`).
    - 버튼 간격 확대 (`gap-4`).
    - 호버 시 스케일 업 애니메이션 (`scale-105`~`110`).
- **Positioning**: 항상 화면 하단에 가깝게 배치 (`bottom-4`).

## 3. Layout & Spacing Convention

플로팅 하단바가 컨텐츠를 가리지 않도록 모든 페이지는 다음의 규칙을 준수해야 합니다.

- **Bottom Padding**: 스크롤 가능한 메인 컨텐츠 영역은 반드시 `pb-24` 이상의 하단 여백을 확보해야 합니다.
- **Fixed/Absolute Elements**: 하단에 고정되는 버튼이나 오버레이 요소(예: 장소 검색 액션바, 미분류 버튼)는 하단바와 겹치지 않도록 최소 `bottom-24` 이상의 위치에 배치해야 합니다.

## 4. Interaction Principles

- 모든 버튼과 인터랙티브 요소는 `active:scale-95` 또는 `transition-all`을 포함하여 즉각적인 피드백을 제공해야 합니다.
- 페이지 전환 및 모달 오픈 시 `framer-motion`을 활용한 부드러운 애니메이션을 권장합니다.
