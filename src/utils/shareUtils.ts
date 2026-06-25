export const shareContent = async (
  title: string,
  text: string,
  url: string,
): Promise<'shared' | 'copied' | 'failed'> => {
  const fullText = `${text}\n\n👉 확인하러 가기:\n${url}`;

  // Use Web Share API if available
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: fullText,
      });
      return 'shared';
    } catch (err) {
      console.warn("Share API failed, falling back to clipboard", err);
      return (await copyToClipboard(fullText)) ? 'copied' : 'failed';
    }
  } else {
    // Fallback for browsers that do not support Web Share API
    return (await copyToClipboard(fullText)) ? 'copied' : 'failed';
  }
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy text", err);
    return false;
  }
};

export const getBaseUrl = () => {
  return window.location.origin;
};

// ==========================================
// 💌 Share Templates
// ==========================================

export const ShareTemplates = {
  trip: (tripTitle: string, tripId: string) => ({
    title: "[달이어리] 여행 계획",
    text: `✈️ 우리의 '${tripTitle}' 여행 계획을 확인해봐!\n\n추가하고 싶은 장소나 일정이 있는지 같이 보면서 여행 준비를 완성해보자 🎒`,
    url: `${getBaseUrl()}/places?tab=plans&tripId=${tripId}`,
  }),
  
  schedule: (dateStr: string, title: string) => ({
    title: "[달이어리] 새로운 일정",
    text: `📅 [${dateStr}] 일정을 캘린더에 추가했어!\n\n일정명: ${title}\n잊지 않게 캘린더에서 미리 확인해봐 👀`,
    url: `${getBaseUrl()}/calendar?date=${dateStr}`,
  }),
  

  
  gameScore: (gameName: string, score: number, gameId: string) => ({
    title: "[달이어리] 미니게임 도전장",
    text: `🎮 내가 [${gameName}]에서 무려 ${score}점 달성함!\n\n이 점수 깰 수 있어? 당장 들어와서 도전해봐 🔥`,
    url: `${getBaseUrl()}/games?game=${gameId}`,
  }),
  
  memory: (title: string, visitId: string) => ({
    title: "[달이어리] 우리의 추억",
    text: `📸 우리의 소중한 추억이 하나 더 기록됐어!\n\n[${title}]\n\n우리가 함께했던 그날의 사진과 이야기를 다시 꺼내볼까? 🥰`,
    url: `${getBaseUrl()}/places?tab=memory&visitId=${visitId}`,
  }),
  
  drawing: (question: string) => ({
    title: "[달이어리] 오늘의 드로잉",
    text: `🎨 오늘의 드로잉 질문: "${question}"\n\n내가 그린 그림 보러올래? 🥰`,
    url: `${getBaseUrl()}/home`,
  })
};
