import { useState, useEffect } from "react";
import {
  User,
  Users,
  Trash2,
  Share2,
  CalendarPlusIcon,
  Edit,
} from "lucide-react";
import DatePicker from "../common/DatePicker";
import { CATEGORY_CONFIG, CategoryType } from "./constants";
import { Schedule, ScheduleInput } from "../../hooks/useSchedules";
import { Profile } from "../../types";
import { shareContent, ShareTemplates } from "../../utils/shareUtils";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: string;
  scheduleToEdit: Schedule | null;
  onSave: (data: ScheduleInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
}

const ScheduleModal = ({
  isOpen,
  onClose,
  initialDate,
  scheduleToEdit,
  onSave,
  onDelete,
  myProfile,
  partnerProfile,
}: ScheduleModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [category, setCategory] = useState<CategoryType>("couple");

  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setTitle(scheduleToEdit.title);
        setDescription(scheduleToEdit.description || "");
        setStartDate(scheduleToEdit.start_date);
        setEndDate(scheduleToEdit.end_date);
        setCategory(scheduleToEdit.category as CategoryType);
      } else {
        setTitle("");
        setDescription("");
        setStartDate(initialDate);
        setEndDate(initialDate);
        setCategory("couple");
      }
    }
  }, [isOpen, scheduleToEdit, initialDate]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (new Date(date) > new Date(endDate)) {
      setEndDate(date);
    }
  };

  const handleEndDateChange = (date: string) => {
    if (new Date(date) < new Date(startDate)) {
      showToast("종료일은 시작일보다 빠를 수 없습니다.", "error");
      setEndDate(startDate);
    } else {
      setEndDate(date);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      showToast("일정 제목을 입력해주세요.", "error");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast("날짜 설정이 올바르지 않습니다.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        category,
        color: CATEGORY_CONFIG[category].color,
      };

      await onSave(data);
      showToast(
        scheduleToEdit ? "일정이 수정되었어요." : "일정이 등록되었어요.",
        "success",
      );
      onClose();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "일정 저장 중 오류가 발생했어요.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (scheduleToEdit) {
      const isConfirmed = await confirm({
        title: "일정 삭제",
        message: "일정을 삭제할까요?",
        confirmText: "삭제",
        isDanger: true,
      });
      if (isConfirmed) {
        setIsDeleting(true);
        try {
          await onDelete(scheduleToEdit.id);
          showToast("일정이 삭제되었어요.", "success");
          onClose();
        } catch (error: any) {
          console.error(error);
          showToast(
            error.message || "일정 삭제 중 오류가 발생했어요.",
            "error",
          );
        } finally {
          setIsDeleting(false);
        }
      }
    }
  };

  const handleShare = async () => {
    const template = ShareTemplates.schedule(startDate, title);
    const result = await shareContent(
      template.title,
      template.text,
      template.url,
    );
    if (result === "copied") {
      showToast(
        "클립보드에 복사되었어요. 메신저에 붙여넣기 해주세요!",
        "success",
      );
    } else if (result === "failed") {
      showToast("링크 복사에 실패했어요.", "error");
    }
  };

  const headerContent = scheduleToEdit ? (
    <div className="absolute right-[4.5rem] top-[1.375rem]">
      <button
        type="button"
        onClick={handleShare}
        className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
        title="일정 공유하기"
      >
        <Share2 size={20} />
      </button>
    </div>
  ) : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={scheduleToEdit ? "일정 수정" : "새 일정 추가"}
      icon={scheduleToEdit ? Edit : CalendarPlusIcon}
      headerContent={headerContent}
      footer={
        <div className="flex gap-3">
          {scheduleToEdit && (
            <Button
              type="button"
              variant="secondary"
              icon={<Trash2 size={18} />}
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="flex-1"
            >
              {" "}
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={() => handleSubmit()}
            disabled={isSaving || isDeleting}
            className={scheduleToEdit ? "flex-[5]" : "flex-1"}
          >
            {scheduleToEdit ? "수정 내용 저장" : "일정 등록하기"}
          </Button>
        </div>
      }
    >
      <form id="schedule-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest px-1">
            제목
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full px-5 py-4 bg-white rounded-2xl border border-gray-100 focus:border-rose-200 focus:ring-2 focus:ring-rose-200 font-bold text-sm sm:text-base outline-none shadow-sm transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="시작 날짜"
            value={startDate}
            onChange={handleStartDateChange}
          />
          <DatePicker
            label="종료 날짜"
            value={endDate}
            onChange={handleEndDateChange}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest px-1">
            누구의 일정인가요?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["me", "partner", "couple"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all shadow-sm ${
                  category === cat
                    ? "bg-white border-rose-200 ring-2 ring-rose-200"
                    : "bg-white border-transparent hover:bg-gray-50 opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
                >
                  {cat === "couple" ? (
                    <Users size={14} className="text-white" />
                  ) : (
                    <User size={14} className="text-white" />
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-black text-gray-700 whitespace-nowrap">
                  {cat === "me"
                    ? myProfile?.nickname || "나"
                    : cat === "partner"
                      ? partnerProfile?.nickname || "상대방"
                      : "우리"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest px-1">
            상세 내용
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="메모를 남겨보세요"
            className="w-full px-5 py-4 bg-white rounded-2xl border border-gray-100 focus:border-rose-200 focus:ring-2 focus:ring-rose-200 font-bold text-sm sm:text-base h-32 resize-none outline-none shadow-sm transition-all"
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default ScheduleModal;
