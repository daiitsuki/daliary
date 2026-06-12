# Daliary (다이어리) 프로젝트 전체 구조도 및 가이드 (PROJECT_MAP)

> 이 파일은 AI가 디렉토리 스캔에 토큰을 낭비하지 않도록 돕는 전체 프로젝트 해설서입니다.
> **AI는 새로운 작업을 시작하기 전 무조건 이 파일을 읽고 전체 아키텍처를 파악해야 합니다.**

---

## 📂 1. `src/` (메인 소스 코드)

### 📄 `src/pages/` (최상위 페이지 라우트)
앱의 큰 탭(메뉴)들을 담당하는 최상위 컨테이너 컴포넌트들입니다.
- `Auth.tsx`: 로그인 / 회원가입 페이지
- `Onboarding.tsx`: 초기 커플 연결 및 프로필 설정
- `Home.tsx`: 메인 대시보드 (출석, 알림, 오늘의 질문 등)
- `Calendar.tsx`: 달력, 기념일, 일정 표시 페이지
- `Games.tsx`: 미니 게임 목록 및 실행 페이지
- `Places.tsx`: 장소 검색 및 데이트 지도 페이지
- `Profile.tsx`: 내 정보, 캐릭터, 인벤토리
- `Settings.tsx`: 앱 전반적인 환경 설정 페이지

### 🧩 `src/components/` (도메인별 세부 UI 컴포넌트)
각 페이지를 구성하는 조각(Presenter)들입니다.
- **`auth/`**: 로그인 및 라우트 보호 (`ProtectedRoute.tsx`)
- **`calendar/`**: 달력 그리드, 일정 추가 모달, 월/년도 선택기
- **`common/`**: 재사용 가능한 공통 UI (모달, 날짜/시간 선택기, 메뉴 드로어, 업데이트 내역 모달 등)
- **`games/`**: 미니 게임 구현체 (2048, 스택 게임, 수박 게임, 블라인드 타이머, 벽돌깨기)
- **`home/`**: 홈 화면 전용 위젯 (오늘의 질문, 하트 게이지, 빠른 링크, 알림 히스토리 등)
- **`layout/`**: 앱의 전체 틀 (하단 네비게이션 바 등)
- **`map/`**: 지도 관련 핵심 기능들
  - `dashboard/`: 전국 단위 한국 지도 통계 및 방문 내역 (`DetailedKoreaMap`, `RegionDashboard`)
  - `memory/`: 추억(피드) 카드 형태의 방문 기록 UI
  - `plans/`: 여행 계획 수립 및 지도에 표시 (`TripModal`, `TripMapModal`)
  - `search/`: 카카오맵 API 기반 장소 검색 (`PlaceSearch`)
  - `wishlist/`: 가고 싶은 장소 위시리스트 관리
- **`profile/`**: 프로필 헤더 및 획득한 아이템 인벤토리
- **`settings/`**: 설정 탭의 각 섹션들 (알림, 화면, 캘린더, 커플 설정, 앱 정보, 위험 구역 등)
- **`timetable/`**: 커플 간 시간표(스케줄) 공유 UI 및 모달

### 🧠 `src/context/` (전역 상태 및 비즈니스 로직)
React Context API를 사용해 앱 전체에서 공유되는 상태를 관리합니다.
- `CoupleContext`, `CouplePointsContext`: 커플 정보 및 공동 포인트 관리
- `HomeContext`, `PlacesContext`, `SchedulesContext`, `TimetableContext`: 도메인별 데이터 로딩 상태 공유
- `NotificationsContext`: 알림 권한 및 설정 정보 관리
- `ToastContext`: 글로벌 알림(토스트 메세지)

### 🪝 `src/hooks/` (데이터 패칭 및 훅)
Supabase DB와 통신하거나 복잡한 상태를 관리하는 커스텀 훅들입니다.
- `useHolidays.ts`, `useAnniversaries.ts`, `useSchedules.ts`: 일정 관련
- `useCouple.ts`, `useCouplePoints.ts`: 커플 연동 및 포인트 조회/수정
- `useGameScore.ts`: 게임 보상 및 기록
- `useHomeData.ts`: 홈 화면 진입 시 필요한 데이터 일괄 패칭
- `useNotifications.ts`, `useTrips.ts`, `useSwipe.ts` 등 도메인별 데이터 로직 분리

### ⚙️ `src/lib/` & `src/utils/` (유틸리티 및 설정)
- `lib/supabase.ts`: Supabase 클라이언트 초기화 및 연결
- `lib/address.ts`: 주소 텍스트 처리 및 파싱
- `utils/imageUtils.ts`, `tripHelpers.ts`: 이미지 최적화 및 헬퍼 함수
- `constants/regions.ts`: 지역 코드 등 고정 상수

---

## 🗄️ 2. `supabase/` (데이터베이스)
Supabase의 스키마, 함수, 마이그레이션 파일들이 모여 있습니다.
- **`migrations/`**: 현재 적용 중인 최신 DB 마이그레이션 (알림 트리거, 리모트 스키마 등)
- **`migrations_old/` & `archive/`**: 과거 스키마 이력 (참고용)

---

## 🛠 3. 최상위 폴더 및 설정 파일
- `public/`: PWA Manifest(`manifest.json`), 서비스 워커(`sw.js`), 앱 아이콘 및 정적 지도 데이터
- `scripts/`: 이미지 최적화 및 유지보수용 Node.js 자동화 스크립트 모음 (`.mjs`)
- `package.json`, `vite.config.ts`, `tailwind.config.js`: 프로젝트 의존성 및 빌드/스타일 설정
- `GEMINI_GUIDELINES.md`: 코딩 컨벤션 및 아키텍처 원칙 (과거 버전 룰셋)
- `.agents/rules/`: **AI 행동 지침(System Rules) 저장소**. AI는 이 폴더 안의 내용에 따라 움직입니다.

---

### 🚨 AI 작업 지침 요약
1. 특정 컴포넌트 수정이 필요하면 `src/components/` 산하의 도메인 폴더를 찾아가세요.
2. 상태값 변경이나 DB 연결 로직 수정은 `src/hooks/`와 `src/context/`를 확인하세요.
3. 데이터베이스 테이블 구조 확인은 항상 `supabase/migrations/`의 최신 마이그레이션 파일을 봅니다.
4. 더 이상 `tree`, `ls`, `find`를 치지 마세요! 이 지도를 보고 바로 해당 파일로 `view_file` 하세요.
