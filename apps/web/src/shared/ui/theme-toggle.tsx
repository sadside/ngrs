import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/shared/lib/theme";
import { cn } from "@/shared/lib/utils";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (collapsed) {
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
          theme === 'light' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun size={14} /> Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
          theme === 'dark' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon size={14} /> Dark
      </button>
    </div>
  );
}
