import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { sendNotification } from "../../utils/notificationUtils";
import { useToast } from "../../context/ToastContext";
import { useHomeData, useCouplePoints } from "../../hooks";

export const useDailyQuestionActions = () => {
  const { todayQuestion, couple, currentUserId, myProfile, refresh } = useHomeData();
  const { refresh: refreshPoints } = useCouplePoints();
  const { showToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const submitAnswer = async (inputAnswer: string) => {
    if (!inputAnswer.trim() || !couple || !currentUserId || !todayQuestion)
      return false;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("answers").insert({
        couple_id: couple.id,
        question_id: todayQuestion.id,
        writer_id: currentUserId,
        content: inputAnswer,
      });
      if (error) throw error;

      await refresh();
      refreshPoints();
      return true;
    } catch (err) {
      console.error(err);
      showToast("답변 저장에 실패했어요.", "error");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestAnswer = async () => {
    const coupleId = couple?.id;
    if (!coupleId || !currentUserId || isRequesting) return;

    const cooldownKey = `last_answer_request_${coupleId}_${currentUserId}`;
    const lastRequestTime = localStorage.getItem(cooldownKey);
    if (lastRequestTime) {
      const timeDiff = Date.now() - parseInt(lastRequestTime, 10);
      if (timeDiff < 5 * 60 * 1000) {
        showToast("이미 알림을 보냈어요. 잠시 후 다시 시도해주세요.", "error");
        return;
      }
    }

    setIsRequesting(true);
    try {
      const { data: partner } = await supabase
        .from("profiles")
        .select("id")
        .eq("couple_id", coupleId)
        .neq("id", currentUserId)
        .maybeSingle();

      if (partner) {
        const { error } = await sendNotification({
          userId: partner.id,
          coupleId: coupleId,
          type: "question_request",
          title: "답변 요청",
          content: `${myProfile?.nickname || "상대방"}님이 오늘의 질문에 답변하라고 요청했어요!`,
        });

        if (error) throw error;

        localStorage.setItem(cooldownKey, Date.now().toString());
        showToast("오늘의 질문에 답변하라는 알림을 보냈어요!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("알림 보내기에 실패했어요.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  return { submitAnswer, isSubmitting, requestAnswer, isRequesting };
};
