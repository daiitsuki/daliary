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

## 5. Notification System

알림 기능은 브라우저 Push API와 Supabase 실시간 연동, 그리고 Vercel 서버리스 함수를 기반으로 하며 다음의 원칙을 따릅니다.

- **Background Push**: 앱이 닫혀 있을 때도 알림을 보내기 위해 Vercel 서버리스 함수(`/api/push.ts`)와 Web Push API(VAPID)를 사용합니다. Supabase Webhook이 `notifications` 테이블의 신규 행을 감지하여 Vercel API를 호출합니다.
- **Device Policy**: 알림은 보안 및 효율성을 위해 사용자당 가장 최근에 설정한 **기기 1대**로만 전송됩니다. (`push_subscriptions` 테이블의 PK가 `user_id`)
- **History Management**: 알림 내역(`notifications` 테이블)은 서버 부하 및 클라이언트 성능을 위해 사용자별로 **최대 20개**까지만 유지 및 표시합니다.
- **Trigger Architecture**: 
    - 답변 완료, 일정 변경, 장소 추가, 방문 인증 등 주요 액션은 PostgreSQL 트리거(`handle_notification_trigger`)를 통해 자동 생성됩니다.
    - 본인에게는 알림을 보내지 않으며, 상대방의 `user_id`를 찾아 알림을 생성합니다.
- **Stacking (Tagging)**: 동일한 유형의 알림이 단시간 내에 여러 번 발생할 경우, 알림이 난잡하게 쌓이지 않도록 `type` 필드를 `tag`로 활용하여 브라우저 수준에서 알림을 스택(Stack) 또는 그룹화하여 처리합니다.
- **Permission UX**: 알림 권한이 거부되었을 경우 세팅 탭에서 사용자에게 브라우저 설정 변경 방법을 친절하게 안내해야 합니다.

## 6. Modal Animation Standard

모든 모달 컴포넌트는 기기 환경에 맞춰 일관된 애니메이션 경험을 제공해야 합니다.

- **Responsive Animation**: `window.innerWidth`를 감지하여 모바일과 데스크탑 애니메이션을 분기합니다.
    - **Mobile (< 768px)**: 하단에서 위로 슬라이드되어 올라오는 애니메이션 (`y: "100%" -> 0`)을 적용합니다. `rounded-t-[32px]`를 사용하여 하단바 느낌을 줍니다.
    - **Desktop (>= 768px)**: 중앙에서 페이드 인과 동시에 살짝 커지며 위로 올라오는 애니메이션 (`opacity: 0, scale: 0.95, y: 20 -> opacity: 1, scale: 1, y: 0`)을 적용합니다. `rounded-[32px]`를 사용하여 플로팅 카드 느낌을 줍니다.
- **Backdrop**: 모든 모달은 `bg-black/50` 배경과 `backdrop-blur-sm` 효과를 가진 백드롭을 가져야 하며, 백드롭 클릭 시 모달이 닫히는 기능을 포함해야 합니다.
- **Back Button Support**: 모달이 열릴 때 브라우저 히스토리에 상태를 추가(`history.pushState`)하여, 사용자가 기기의 뒤로가기 버튼을 눌렀을 때 페이지가 이동하는 대신 모달만 닫히도록 구현해야 합니다.
- **Transitions**: `type: "tween"`, `ease: "easeOut"`, `duration: 0.2`~`0.25` 수준의 부드럽고 빠른 전환을 권장합니다.
- **Portals**: 레이아웃 간섭을 방지하기 위해 모든 모달은 `createPortal`을 통해 `document.body` 최하단에 렌더링되어야 합니다.
