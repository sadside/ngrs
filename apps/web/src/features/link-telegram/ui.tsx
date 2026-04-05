import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle } from '@phosphor-icons/react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from '@/shared/ui/responsive-dialog';
import { getMeFn } from '@/entities/session/api';
import { useGenerateLinkToken } from './api';

interface LinkTelegramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkTelegramDialog({ open, onOpenChange }: LinkTelegramDialogProps) {
  const qc = useQueryClient();
  const generate = useGenerateLinkToken();
  const [tokenData, setTokenData] = useState<{ deepLink: string; expiresAt: string } | null>(null);

  const { data: me } = useQuery({
    queryKey: ['session', 'me'],
    queryFn: getMeFn,
    enabled: open,
    refetchInterval: open ? 3000 : false,
  });

  useEffect(() => {
    if (open && !tokenData) {
      generate.mutate(undefined, {
        onSuccess: (data) => setTokenData({ deepLink: data.deepLink, expiresAt: data.expiresAt }),
        onError: () => {
          toast.error('Не удалось создать ссылку');
          onOpenChange(false);
        },
      });
    }
    if (!open) {
      setTokenData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && me?.telegramChatId) {
      toast.success('Telegram успешно привязан');
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ['session', 'me'] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, me?.telegramChatId]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Привязка Telegram</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4">
          {generate.isPending && (
            <p className="text-sm text-muted-foreground text-center py-8">Генерация ссылки…</p>
          )}
          {tokenData && (
            <>
              <div className="flex justify-center py-2">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={tokenData.deepLink} size={200} />
                </div>
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Отсканируйте QR-код телефоном или нажмите на ссылку ниже.</li>
                <li>В Telegram нажмите кнопку <b>START</b>.</li>
                <li>Бот отправит вам подтверждение.</li>
              </ol>
              <a
                href={tokenData.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-primary hover:underline break-all"
              >
                {tokenData.deepLink}
              </a>
              <p className="text-xs text-muted-foreground text-center">
                Ссылка действительна 15 минут.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                <CheckCircle size={16} className="text-muted-foreground" />
                Ожидание подтверждения…
              </div>
            </>
          )}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
