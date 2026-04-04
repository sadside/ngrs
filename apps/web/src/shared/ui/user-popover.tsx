import { useState } from "react";
import { CaretDown, SignOut } from "@phosphor-icons/react";
import { useUnit } from "effector-react";
import { useNavigate } from "@tanstack/react-router";
import { $user, sessionCleared } from "@/entities/session/model";
import { Badge } from "./badge";
import { Button } from "./button";
import { ROLE_LABELS } from "@/shared/config/constants";

const ROLE_VARIANT: Record<string, 'danger' | 'info' | 'neutral'> = {
  ADMIN: 'danger',
  LOGIST: 'info',
  DRIVER: 'neutral',
};

export function UserPopover() {
  const user = useUnit($user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-foreground leading-none">{user.fullName}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
        <CaretDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-popover border border-border rounded-xl shadow-lg p-2 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 border-b border-border mb-2">
              <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'} size="sm" className="mt-1">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={() => { sessionCleared(); navigate({ to: '/login' }); setOpen(false); }}
            >
              <SignOut size={16} />
              Выйти
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
