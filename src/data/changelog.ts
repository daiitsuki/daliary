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
];
