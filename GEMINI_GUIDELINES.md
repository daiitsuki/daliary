# Daliary Project Guidelines for Gemini

> **Critical Note on Database Schema**: The authoritative source for the database schema is `supabase/consolidated_schema.sql`. Always refer to that file for the latest table definitions, functions, and policies. The summary below is for quick reference.

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
    - 답변 완료, 일정 변경, 장소 추가, 방문 인증, **아이템 구매** 등 주요 액션은 PostgreSQL 트리거(`handle_notification_trigger`)를 통해 자동 생성됩니다.
    - 본인에게는 알림을 보내지 않으며, 상대방의 `user_id`를 찾아 알림을 생성합니다. (단, 레벨 업 알림은 쌍방에게 발송됩니다.)
- **Stacking (Tagging)**: 동일한 유형의 알림이 단시간 내에 여러 번 발생할 경우, 알림이 난잡하게 쌓이지 않도록 `type` 필드를 `tag`로 활용하여 브라우저 수준에서 알림을 스택(Stack) 또는 그룹화하여 처리합니다.
- **Permission UX**: 알림 권한이 거부되었을 경우 세팅 탭에서 사용자에게 브라우저 설정 변경 방법을 친절하게 안내해야 합니다.

## 6. Modal Animation & Implementation Standard

모든 모달 컴포넌트는 기기 환경에 맞춰 일관된 디자인과 인터랙션을 제공해야 합니다.

- **Design (Glassmorphism)**: 
    - 컨테이너: `bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl`
    - 헤더: `bg-white/40 backdrop-blur-md border-b border-white/20`
- **Responsive Animation**: `isMobile` (window.innerWidth < 768px) 상태를 감지하여 애니메이션을 분기합니다.
    - **Initial/Exit**: `isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }`
    - **Animate**: `isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }`
    - **Transition**: `type: "tween", ease: "easeOut", duration: 0.25` 수준의 부드럽고 빠른 전환을 권장합니다.
- **Backdrop**: 모든 모달은 `bg-black/40` 배경과 `backdrop-blur-sm` 효과를 가진 백드롭을 가져야 하며, 백드롭 클릭 시 모달이 닫히는 기능을 포함해야 합니다.
- **Back Button Support**: 모달이 열릴 때(`isOpen` 기준) 브라우저 히스토리에 상태를 추가(`history.pushState`)하여, 사용자가 기기의 뒤로가기 버튼을 눌렀을 때 페이지가 이동하는 대신 모달만 닫히도록 구현해야 합니다.
- **Portals & AnimatePresence**: 레이아웃 간섭을 방지하기 위해 모든 모달은 `createPortal`을 통해 `document.body` 최하단에 렌더링되어야 하며, `AnimatePresence`를 통해 조건부 렌더링 시의 애니메이션을 보장해야 합니다.

## 7. Data Fetching & Performance Optimization

효율적인 서버 자원 활용과 확장성 있는 구조를 위해 **'하이브리드 영역별 데이터 창구'** 원칙을 엄격히 준수합니다.

- **Hybrid Data Fetching Strategy**:
    - **공통 데이터 (Foundation)**: 앱 구동 및 권한 확인에 필수적인 데이터(`profile`, `couple`, `is_couple_formed`, `notification_settings`)는 `get_app_init_data` RPC를 통해 **단 한 번의 요청**으로 가져옵니다.
    - **도메인 데이터 (Domain-Specific)**: 일정, 다이어리, 포인트 등 각 기능별 데이터는 해당 도메인을 담당하는 Context/Hook에서 **독립적인 React Query**를 통해 각각 호출합니다.
- **Independence & Scalability**:
    - "모든 것을 담는 단 하나의 통로" 대신 "영역별로 잘 정리된 창구"를 지향합니다. 기능이 100개로 늘어나도 공통 RPC가 비대해지지 않으며, 각 도메인은 서로 간섭 없이 독립적으로 유지보수될 수 있습니다.
- **Sequential Loading (Dependency Chain)**:
    - 도메인 쿼리는 반드시 공통 데이터 로딩(`loading`)이 완료되고 필수 ID가 확보된 시점에만 실행되도록 `enabled` 옵션을 설정합니다.
    - 예: `enabled: !!couple?.id && !!profile?.id && !coupleLoading`
- **Selective Column Fetching**: 
    - `select('*')` 사용을 엄격히 금지하며, 반드시 필요한 컬럼만 명시적으로 선택합니다.

## 8. Data Structure & Processing Flow

앱의 데이터 처리는 다음과 같은 계층화된 전문 창구 구조를 따릅니다.

1.  **Level 0: Foundation RPC (get_app_init_data)**
    *   `App.tsx` 마운트 시 호출되어 앱의 '뼈대'가 되는 공통 정보를 JSON으로 수신합니다.
2.  **Level 1: Foundation Hydration (CoupleContext)**
    *   수신된 뼈대 데이터를 기반으로 앱의 전역 인증 및 연결 상태를 형성합니다.
3.  **Level 2: Domain-Specific Service (Individual Providers)**
    *   **Diary/Home**: 오늘의 질문과 답변 관리 (`HomeContext`)
    *   **Schedule**: 커플 일정 데이터 관리 (`SchedulesContext`)
    *   **Points**: 경험치 및 출석 데이터 관리 (`CouplePointsContext`)
    *   **Notifications**: 알림 내역 관리 (`NotificationsContext`)
    *   이들은 각자 독립적으로 데이터를 페칭하고 React Query 캐시를 관리합니다.
4.  **Level 3: Operational Action (Realtime & Mutation)**
    *   데이터 변경은 `useMutation`을 통한 즉시 반영과 `supabase.channel`을 통한 실시간 동기화로 처리합니다.

## 9. TanStack Query (React Query) Usage Standard

- **Query Keys**: 커플 데이터는 `['..._data', couple?.id]`, 유저 데이터는 `['..._data', profile?.id]`.
- **Domain Responsibility**: 각 기능별 데이터는 독립된 Query Key를 가져야 하며, 다른 도메인의 쿼리에 의존하지 않습니다.
- **Invalidation**: `useMutation` 성공 시 관련 도메인의 쿼리 키만 `invalidateQueries`하여 영향 범위를 최소화합니다.
- **Infinite Query**: 목록형 데이터는 `useInfiniteQuery`를 사용합니다.

## 10. Database Migration Policy

- **Immutable Past**: 이미 실행된 migration 파일은 절대로 수정하지 않습니다.
- **Add-Only Strategy**: 모든 스키마 및 함수 변경은 항상 새로운 버전 번호의 파일을 추가하는 방식으로 진행합니다. (예: `2026021332_mega_app_init_data.sql`)
- **Idempotency**: `create or replace function`을 사용하여 멱등성을 유지합니다.

## 11. TypeScript & Code Quality

- **No Emit Errors**: 모든 코드 수정 후에는 반드시 `npx tsc --noEmit`을 실행하여 타입 에러가 없는지 확인해야 합니다.
- **Explicit Typing**: 쿼리 결과나 함수의 인자/반환값에 명시적인 인터페이스와 타입을 지정하여 코드 안정성을 높입니다.
- **Unused Imports**: 사용하지 않는 Hook이나 라이브러리 임포트는 즉시 제거하여 깨끗한 코드 상태를 유지합니다.

## 12. Travel Plans Data Structure

여행 계획 기능은 다음과 같은 테이블 구조를 가집니다.

### `trips` Table (여행 단위)
- `id`: UUID (Primary Key)
- `couple_id`: UUID (Foreign Key to `couples.id`)
- `title`: TEXT (여행 제목, 예: "제주도 여행")
- `start_date`: DATE (시작일)
- `end_date`: DATE (종료일)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### `trip_plans` Table (여행 내 세부 계획)
- `id`: UUID (Primary Key)
- `trip_id`: UUID (Foreign Key to `trips.id`)
- `day_number`: INTEGER (n일차, 1부터 시작)
- `category`: TEXT (식당, 이동, 카페, 숙소, 기타 등)
- `start_time`: TIME (시작 시간, 예: "14:00")
- `end_time`: TIME (종료 시간, 예: "15:30")
- `memo`: TEXT (간단한 메모)
- `place_name`: TEXT (장소명)
- `address`: TEXT (주소)
- `lat`: DOUBLE PRECISION (위도)
- `lng`: DOUBLE PRECISION (경도)
- `order_index`: INTEGER (일차 내 정렬 순서)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### 12.1. 여행 계획 구현 참고 사항
- **알림 트리거**: 여행 계획의 추가/수정/삭제 알림은 `trips` 테이블의 변경 사항을 감지하여 발송됩니다. 세부 계획(`trip_plans`)의 변경은 현재 트리거되어 있지 않으며, 필요 시 추가 구현이 필요합니다.
- **날짜 계산**: 시작일과 종료일이 같은 경우 1일차 여행(당일치기)으로 처리됩니다.
- **시간 선택**: `TimePicker` 컴포넌트는 `DatePicker`의 드롭다운 인터페이스 디자인을 계승하여 5분 단위 선택이 가능하도록 구현되었습니다.

## 13. Database Schema Reference (Consolidated)

이 섹션은 2026년 2월 19일 기준 `supabase/consolidated_schema.sql`의 요약입니다. 모든 테이블은 RLS가 활성화되어 있습니다.

### Core Tables
*   **`couples`**: 커플 정보 (기념일, 초대 코드). `invite_code`는 고유값.
*   **`profiles`**: 사용자 정보 (닉네임, 아바타). `auth.users`와 1:1 매핑되며 `couple_id`로 커플과 연결됩니다.

### Feature Tables
*   **`places`**: 찜한 장소 및 방문 기록의 기초 데이터. 카카오 장소 ID로 유니크 제약.
*   **`visits`**: 실제 방문 인증 기록. `visit-photos` 스토리지 버킷의 이미지 URL을 저장합니다.
*   **`visit_comments`**: 방문 기록에 대한 댓글.
*   **`questions` & `answers`**: 매일의 질문 및 답변.
*   **`schedules`**: 캘린더 일정. 카테고리(`me`, `partner`, `couple`)로 구분.
*   **`attendances`**: 일일 출석 체크. `(user_id, check_in_date)` 복합 유니크 키.
*   **`point_history`**: 커플 포인트 로그 (방문, 답변, 출석 등).

### Notification System Tables
*   **`notifications`**: 알림 이력. `is_read` 상태 관리.
*   **`notification_settings`**: 사용자별 알림 수신 여부 (세분화된 필드 포함: `notify_question_answered` 등).
*   **`push_subscriptions`**: 웹 푸시 구독 정보 (VAPID). 사용자당 1개의 기기만 유지.

### Key Security Policies (RLS)
*   **Couple Isolation**: 대부분의 테이블(`places`, `visits`, `schedules` 등)은 `couple_id = get_auth_couple_id()` 또는 서브쿼리를 통해 **내 커플의 데이터만** 조회/수정 가능하도록 격리되어 있습니다.
*   **User Ownership**: `profiles`, `notification_settings` 등 개인화된 데이터는 `auth.uid() = user_id` 조건으로 본인만 접근 가능합니다.

### Storage Buckets
*   **`visit-photos`**: 방문 인증 사진 저장소.
*   **`diary-images`**: 프로필 사진(아바타) 등 기타 이미지 저장소.

## 14. Point Management System

포인트 시스템은 '레벨 계산용 누적 포인트'와 '상점 이용용 현재 잔액'을 분리하여 관리합니다.

### 14.1. Point Types
- **Cumulative Points (누적 포인트)**: 
    - 사용자가 획득한 모든 포인트의 총합 (양수 값만 합산).
    - 커플 레벨 및 경험치 게이지 계산에 사용됩니다.
    - 포인트를 소모하더라도 이 수치는 줄어들지 않습니다.
- **Current Points (현재 잔액)**:
    - 획득한 포인트에서 사용한 포인트를 뺀 최종 잔액 (전체 합계).
    - 향후 포인트 상점에서 상품 구매 시 소모되는 수치입니다.

### 14.3. Item System & Point Shop
- **System Logic**:
    - 포인트는 커플이 공유하며, 아이템 또한 커플이 공유하여 보유합니다 (`couple_items` 테이블).
    - 아이템 구매 시 `purchase_item` RPC를 통해 원자적으로 포인트 차감 및 아이템 지급이 이루어집니다.
    - 아이템 사용 시 `use_item` RPC를 통해 수량을 차감합니다.
- **Available Items**:
    - **지난 질문 답변 티켓 (`past_question_ticket`)**: 
        - 가격: 230 PT
        - 용도: 답변 기간이 지난 과거의 질문에 답변을 남길 수 있게 해줍니다.
        - 보상: 답변 완료 시 일반 질문과 동일하게 30 PT를 획득합니다.
- **UI/UX**:
    - 포인트 상점은 `PointHistoryModal.tsx` 내 '포인트 상점' 탭에 위치합니다.
    - 보유한 아이템은 '설정 > 보관함' (`InventorySection.tsx`)에서 확인할 수 있습니다.

## 15. PostgreSQL Function Standards

데이터 일관성과 SQL 가독성을 위해 RPC 및 트리거 함수 작성 시 다음 원칙을 준수합니다.

- **Return Types**:
    - 여러 컬럼이나 필드를 반환하고 다른 SQL 문(`SELECT ... FROM`)에서 사용될 가능성이 있는 경우, `RETURNS json` 대신 `RETURNS TABLE(...)`을 사용합니다.
    - 복잡하고 동적인 구조가 필요한 경우에만 `RETURNS json`을 사용합니다.
- **Error Handling**:
    - 비즈니스 로직 위반 시 `RAISE EXCEPTION`을 사용하여 프론트엔드에서 에러를 인지할 수 있게 합니다.
    - RPC 내부에서는 `get_auth_couple_id()`와 같은 헬퍼 함수를 적극 활용하여 권한 검사를 수행합니다.
- **Atomic Operations**:
    - 포인트 차감과 아이템 지급과 같이 연계된 작업은 반드시 하나의 RPC 함수 내에서 트랜잭션으로 처리하여 데이터 무결성을 보장합니다.

## 16. PostgreSQL Trigger Best Practices

트리거 함수가 여러 테이블에 공유될 때 발생할 수 있는 런타임 에러를 방지하기 위해 다음 원칙을 준수합니다.

- **Defensive Column Access**:
    - 트리거 함수 내에서 `NEW` 또는 `OLD` 레코드의 특정 컬럼에 접근할 때는, 반드시 해당 컬럼이 존재하는 테이블인지 `TG_TABLE_NAME`을 통해 먼저 확인해야 합니다.
    - 예: `IF (TG_TABLE_NAME = 'places' AND NEW.status = 'wishlist')` 대신 `IF (TG_TABLE_NAME = 'places') THEN IF (NEW.status = 'wishlist') THEN ...` 구조를 사용하여, `status` 컬럼이 없는 다른 테이블(예: `point_history`)에서 트리거가 실행될 때 `record "new" has no field "status"` 에러가 발생하는 것을 방지합니다.
- **Minimal Logic**:
    - 트리거 함수는 가능한 가볍게 유지하며, 복잡한 비즈니스 로직은 RPC 또는 전용 서비스 함수로 분리하는 것을 권장합니다.

## 17. Game System & Rewards

사용자가 즐길 수 있는 미니게임과 그에 따른 보상 체계입니다.

### 17.1. Game Score Management
- **Table**: `game_scores`
- **Fields**: `user_id`, `couple_id`, `game_type`, `high_score`, `last_reward_date`
- **Logic**: 최고 점수는 개인별로 기록하며, 보상 수령 여부는 `last_reward_date`를 통해 일 단위로 체크합니다.

### 17.2. 2048 Challenge
- **Game Type**: `'2048'`
- **Reward Condition**: 게임 플레이 중 2048 타일을 처음 생성했을 때 (일 1회 한정).
- **Reward Amount**: 100 PT (커플 포인트)
- **Controls**: PC(방향키), Mobile(스와이프 제스처).
- **Theme**: Rose/Amber 그라데이션과 Glassmorphism 스타일을 유지하되, 타일별로 고유한 색상(Rose 계열)을 부여하여 시각적 즐거움을 제공합니다.

### 17.3. Implementation Pattern
- **Hook**: `useGameScore(gameType)`을 사용하여 점수 조회 및 결과 기록(`record_game_result` RPC 호출)을 관리합니다.
- **RPC**: `record_game_result(p_game_type, p_score, p_reached_target)`는 원자적으로 최고 점수 갱신과 포인트 지급을 처리합니다.
