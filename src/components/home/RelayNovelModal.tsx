import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Loader2,
  Dice5,
  Pencil,
  Check,
  X,
  Undo2,
  NotebookTabs,
  BookCheck,
} from "lucide-react";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";
import Input from "../common/Input";
import Textarea from "../common/Textarea";
import { useRelayNovel } from "../../hooks/features/useRelayNovel";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

interface RelayNovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelId?: string; // If undefined, it means "Create New" mode or "No ongoing novel"
  partnerNickname: string;
  myProfileId: string;
  partnerId?: string;
  myNickname?: string;
}

const STARTER_PROMPTS = [
  "어느 날 아침, 눈을 떠보니 우리는 낯선 행성에 불시착해 있었다.",
  "평소와 다를 것 없던 데이트 날, 상대방이 내게 건넨 상자 안에는...",
  "우리집 강아지가 갑자기 사람의 말을 하기 시작했다. 가장 먼저 한 말은...",
  "우연히 발견한 낡은 일기장. 첫 페이지를 넘기자 익숙한 필체가 보였다.",
  "10년 뒤 미래에서 온 내가 나에게 전화를 걸었다. '지금 당장...'",
  "눈을 떠보니 학창 시절, 서로를 처음 만났던 바로 그 교실이었다.",
  "세상의 모든 색이 사라진 날, 유일하게 상대방만이 색을 띠고 있었다.",
  "우리가 함께 맞춘 커플링에서 갑자기 알 수 없는 빛이 뿜어져 나오기 시작했다.",
  "비 오는 밤, 내 방 문을 두드리는 소리에 나가보니 기억을 잃은 네가 서 있었다.",
  "인류의 마지막 대피소에서 눈을 떴을 때, 생존자 명단에 네 이름만 지워져 있었다.",
  "아침에 일어나 거울을 본 순간, 나는 네가 되어 있었다.",
  "우연히 들른 박물관, 수백 년 전 초상화 속 두 사람은 완벽하게 우리와 닮아 있었다.",
  "네가 내 곁을 떠나는 오늘이 벌써 100번째 반복되고 있다. 이번엔 반드시...",
  "서로의 손이 닿는 순간, 우리는 타인의 속마음을 읽을 수 있는 능력이 생겼다.",
  "네가 잠시 자리를 비운 사이, 네 핸드폰으로 온 메시지. '지금 네 앞에 있는 사람은 가짜야.'",
  "평행세계의 문이 열리고, 그곳에서 온 또 다른 네가 내게 말했다. '그 사람을 절대 믿지 마.'",
  "로그아웃 버튼이 사라진 가상현실 게임 속, 우리는 게임 오버가 곧 현실의 죽음이라는 시스템 메시지를 받았다.",
  "수취인 불명으로 돌아온 편지. 발신인은 분명 어제의 나였지만, 수신인은 1년 후의 너였다.",
  "눈을 뜨자 너는 나를 보며 환하게 웃었다. '처음 뵙겠습니다, 누구신가요?'",
  "평범한 직장인인 줄 알았던 네가, 날아오는 물건을 보지도 않고 한 손으로 막아냈다.",
  "내가 슬퍼할 때마다 하늘에서 벚꽃잎이 떨어지기 시작했고, 너는 조용히 내게 우산을 씌워주었다.",
  "좀비 바이러스가 퍼진 지 3일째, 항체를 가진 유일한 사람이 바로 너라는 사실을 알게 되었다.",
  "매일 밤 같은 꿈을 꾸었다. 그리고 오늘, 꿈속에서만 만났던 네가 내 눈앞에 나타났다.",
  "마녀의 저주가 풀리던 날, 우리는 서로를 온전히 기억하는 대가로 목소리를 잃었다.",
  "라디오에서 흘러나오는 사연, 그것은 누구에게도 말하지 않은 우리 둘만의 비밀이었다.",
  "버려진 놀이공원, 멈춰 있던 회전목마가 우리가 발을 들이자마자 기괴한 음악과 함께 돌아가기 시작했다.",
  "네가 나에게 건넨 커피를 마신 순간, 주변 사람들의 시간이 모두 멈춰버렸다.",
  "지하철 문이 닫히기 직전 뛰어들어온 너, 그리고 네 등 뒤에 접혀 있는 거대한 검은 날개.",
  "우리가 매일 걷던 산책로 끝에, 어제까지는 없었던 거대한 낡은 저택이 세워져 있었다.",
  "서로의 핸드폰 번호가 갑자기 바뀌었다. 그리고 모르는 번로부터 '이제 첫 번째 게임이 시작되었습니다'라는 문자가 도착했다.",
];

export default function RelayNovelModal({
  isOpen,
  onClose,
  novelId,
  partnerNickname,
  myProfileId,
  partnerId,
  myNickname,
}: RelayNovelModalProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const {
    novel,
    turns,
    loading,
    addTurn,
    completeNovel,
    createNovel,
    updateTitle,
    updateSettingNotes,
    deleteTurn,
  } = useRelayNovel(novelId);

  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [newTitle, setNewTitle] = useState("우리의 릴레이 소설");
  const [starterContent, setStarterContent] = useState(
    STARTER_PROMPTS[Math.floor(Math.random() * STARTER_PROMPTS.length)],
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, turns]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditingTitle(false);
      setIsNotesOpen(false);
    } else if (novel) {
      setEditTitleValue(novel.title);
      // Load draft
      if (novelId) {
        const draft = localStorage.getItem(`relay_novel_draft_${novelId}`);
        if (draft) setInputText(draft);
      }
    }
  }, [isOpen, novel, novelId]);

  useEffect(() => {
    if (isNotesOpen && novel) {
      setNotesValue(novel.setting_notes || "");
    }
  }, [isNotesOpen, novel]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    const success = await updateSettingNotes(notesValue);
    setIsSavingNotes(false);
    if (success) {
      setIsNotesOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 300) {
      setInputText(text);
      if (novelId) {
        localStorage.setItem(`relay_novel_draft_${novelId}`, text);
      }
    }
  };

  const handleSubmit = async () => {
    const formattedText = inputText.trim().replace(/\n{2,}/g, "\n");
    if (!formattedText || isSubmitting) return;
    setIsSubmitting(true);
    const success = await addTurn(formattedText, partnerId, myNickname);
    if (success) {
      setInputText("");
      if (novelId) {
        localStorage.removeItem(`relay_novel_draft_${novelId}`);
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    setIsSubmitting(false);
  };

  const handleComplete = async () => {
    const isConfirmed = await confirm({
      title: "소설 완결",
      message:
        "정말 이 소설을 완결하시겠습니까?\n더 이상 글을 쓸 수 없게 됩니다.",
      confirmText: "완결하기",
      cancelText: "취소",
      isDanger: false,
    });

    if (isConfirmed) {
      setIsCompleting(true);
      await completeNovel();
      setIsCompleting(false);
    }
  };

  const handleDeleteTurn = async (turnId: string) => {
    const isConfirmed = await confirm({
      title: "문장 삭제",
      message: "마지막으로 작성한 문장을 삭제할까요?",
      confirmText: "삭제하기",
      cancelText: "취소",
      isDanger: true,
    });
    if (isConfirmed) {
      await deleteTurn(turnId);
    }
  };

  const handleCreateNew = async () => {
    if (!newTitle.trim()) {
      showToast("소설 제목을 입력해주세요.", "error");
      return;
    }
    if (!starterContent.trim()) {
      showToast("첫 문장을 입력해주세요.", "error");
      return;
    }
    setIsSubmitting(true);
    await createNovel(newTitle.trim(), starterContent.trim());
    setIsSubmitting(false);
    onClose(); // Close and let parent handle reopening with new ID, or let widget show the new one.
  };

  const rerollStarter = () => {
    const currentIndex = STARTER_PROMPTS.indexOf(starterContent);
    let newIndex = currentIndex;
    while (newIndex === currentIndex || newIndex === -1) {
      newIndex = Math.floor(Math.random() * STARTER_PROMPTS.length);
    }
    setStarterContent(STARTER_PROMPTS[newIndex]);
  };

  const handleSaveTitle = async () => {
    if (!editTitleValue.trim() || editTitleValue === novel?.title) {
      setIsEditingTitle(false);
      return;
    }
    await updateTitle(editTitleValue.trim());
    setIsEditingTitle(false);
  };

  // CREATE NEW NOVEL UI
  if (!novelId || (!loading && !novel)) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="새로운 릴레이 소설"
        icon={BookOpen}
        contentClassName="p-6 space-y-6"
      >
        <div className="space-y-4">
          <div className="mb-2">
            <Input
              label="소설 제목"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="소설 제목은 언제든지 수정할 수 있습니다."
              maxLength={30}
              clearable
              onClear={() => setNewTitle("")}
              wrapperClassName="w-full"
            />
          </div>

          <div>
            <div className="mb-1 ml-1 flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">
                첫 문장 (직접 작성 가능)
              </label>
              <button
                onClick={rerollStarter}
                className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-400 transition-colors hover:bg-rose-100"
              >
                <Dice5 size={12} />
                랜덤 뽑기
              </button>
            </div>
            <Textarea
              value={starterContent}
              className="bg-rose-50 hover:bg-rose-50"
              onChange={(e) => setStarterContent(e.target.value)}
              placeholder="직접 첫 문장을 작성하거나 랜덤 뽑기를 이용해보세요!"
              maxLength={300}
            />
          </div>

          <Button
            onClick={handleCreateNew}
            className="w-full bg-rose-400 py-3 font-bold text-white hover:bg-rose-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "소설 시작하기"
            )}
          </Button>
        </div>
      </BaseModal>
    );
  }

  const recentTurns = turns.slice(-2);
  const hasWrittenTwice =
    recentTurns.length === 2 &&
    recentTurns.every((turn) => turn.author_id === myProfileId);

  // ONGOING/COMPLETED NOVEL UI
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <AnimatePresence mode="wait">
          {isEditingTitle ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="mt-1 flex w-full items-start gap-2 pr-8 leading-normal"
            >
              <Input
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                autoFocus
                maxLength={30}
                size="sm"
                clearable={false}
                wrapperClassName="w-[180px] sm:w-[240px]"
              />
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={handleSaveTitle}
                  className="rounded p-1 text-green-500 hover:bg-green-50"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditTitleValue(novel?.title || "");
                  }}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <span
                className="cursor-pointer transition-colors hover:text-gray-500"
                onClick={() =>
                  novel?.status === "ongoing" && setIsEditingTitle(true)
                }
                title={
                  novel?.status === "ongoing" ? "제목 수정하기" : undefined
                }
              >
                {novel?.title || "릴레이 소설"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      }
      subtitle={
        novel?.status === "completed"
          ? "완결된 소설"
          : `진행 중인 소설 [${novel?.turn_count || 0} / 100턴]`
      }
      icon={BookOpen}
      contentClassName="p-0 flex flex-col h-[75vh] md:h-[80vh] min-h-[50vh] flex-1 bg-white relative"
      allowFullscreen
    >
      <AnimatePresence>
        {isNotesOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 z-50 flex flex-col bg-white p-6 md:p-8"
          >
            <p className="mb-4 text-[13px] font-medium text-gray-500">
              주인공 이름, 세계관 등 잊어버리기 쉬운 설정들을 적어두세요. 두
              사람이 함께 볼 수 있습니다.
            </p>
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="flex-1 bg-rose-50/30 font-medium"
              placeholder="이름이나 세계관 등 설정을 적어두세요."
            />
            <div className="mt-6 flex shrink-0 gap-3">
              <Button
                variant="outline"
                className="flex-1 font-bold"
                onClick={() => setIsNotesOpen(false)}
              >
                닫기
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-rose-400 font-bold hover:bg-rose-500"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? (
                  <Loader2 className="m-auto animate-spin" size={20} />
                ) : (
                  "저장하기"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages / Turns Area (Book Style, Clean) */}
      <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-white px-6 py-8 md:px-12 md:py-10">
        {loading && turns.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-rose-300" size={32} />
          </div>
        ) : (
          <div className="relative mx-auto max-w-3xl">
            <h2 className="mb-10 border-b border-gray-100 pb-6 text-center font-serif text-xl font-bold text-gray-800 md:text-2xl">
              {novel?.title}
            </h2>

            <div className="space-y-0">
              {turns.map((turn, index) => {
                const isMe = turn.author_id === myProfileId;
                const isLastTurn = index === turns.length - 1;
                const canDelete =
                  isLastTurn && isMe && novel?.status === "ongoing";

                return (
                  <div
                    key={turn.id}
                    className={`group relative font-serif text-[15px] leading-loose break-words break-keep transition-colors md:text-[16px] ${
                      isMe ? "text-gray-800" : "text-stone-500"
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{turn.content}</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTurn(turn.id)}
                        className="ml-2 inline-flex items-center justify-center rounded-md p-1.5 align-middle text-gray-400 transition-all hover:bg-rose-50 hover:text-rose-500"
                        title="마지막 문장 취소하기"
                      >
                        <Undo2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      {novel?.status === "ongoing" && (
        <div className="shrink-0 border-t border-gray-100 bg-white p-4 md:p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            <div className="flex items-center justify-end gap-2 px-1">
              <button
                onClick={() => setIsNotesOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-500"
              >
                <NotebookTabs size={14} />
                설정집
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              >
                <BookCheck size={14} />
                완결하기
              </button>
            </div>
            <div className="relative">
              <Textarea
                value={inputText}
                onChange={handleInputChange as any}
                disabled={isSubmitting || hasWrittenTwice}
                className="text-sm"
                maxLength={300}
                placeholder={
                  hasWrittenTwice
                    ? `최대 2번까지 작성할 수 있습니다.\n${partnerNickname}님의 답장을 기다려주세요!`
                    : "다음 이야기를 이어가주세요 (최대 300자)"
                }
              />
              <Button
                onClick={handleSubmit}
                disabled={!inputText.trim() || isSubmitting || hasWrittenTwice}
                className="absolute right-3 bottom-9 h-9 w-9 flex-shrink-0 rounded-full !p-0 shadow-md"
                variant="primary"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="m-auto animate-spin" />
                ) : (
                  <Pencil size={16} className="m-auto" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
