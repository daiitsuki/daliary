export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-01-27",
    changes: ["달이어리 앱 출시!"],
  },

  {
    version: "1.0.1",
    date: "2026-01-28",
    changes: [
      "빠른이동 기능이 추가되었어요. 자주 방문하는 웹사이트를 등록해보세요.",
      "일기(타임라인) 기능이 삭제되었어요.",
    ],
  },
  {
    version: "1.0.2",
    date: "2026-01-29",
    changes: [
      "일정 기능이 추가되었어요. 서로의 일정을 공유해보세요!",
      "포인트 획득 루트가 추가되었어요. 다양한 포인트 획득 방법은 하트 게이지를 눌러 확인해보세요!",
      "지도 ▶ 지역 클릭 ▶ 방문 인증 사진 모아보기에 댓글 기능이 추가되었어요.",
      "앱 성능을 최적화하고 다양한 버그를 수정했어요.",
    ],
  },
  {
    version: "1.0.3",
    date: "2026-01-31",
    changes: [
      "마지막으로 접속한 기록을 확인하는 기능이 추가되었어요.",
      "이제 일정 탭에서 공휴일을 확인할 수 있어요",
    ],
  },
];
