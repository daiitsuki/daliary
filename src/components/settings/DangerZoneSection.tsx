import { LogOut, HeartOff } from "lucide-react";
import Button from "../common/Button";

interface DangerZoneSectionProps {
  onLogout?: () => void;
  onDisconnect?: () => void;
}

export default function DangerZoneSection({
  onLogout,
  onDisconnect,
}: DangerZoneSectionProps) {
  return (
    <section className="flex flex-col items-center w-full mt-4 pb-8">
      <div className="flex flex-col items-center gap-4 mt-2">
        {onLogout && (
          <Button
            onClick={onLogout}
            variant="link"
            size="sm"
            icon={<LogOut size={12} />}
            fullWidth={false}
          >
            로그아웃
          </Button>
        )}

        {onDisconnect && (
          <Button
            onClick={onDisconnect}
            variant="link"
            size="sm"
            icon={<HeartOff size={12} />}
            fullWidth={false}
          >
            커플 연결 해제하기
          </Button>
        )}
      </div>
    </section>
  );
}
