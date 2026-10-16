import * as React from "react";
import { Moon, Monitor, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeLabels = {
  light: "Ақ",
  dark: "Қара",
  system: "Жүйе",
} as const;

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const currentTheme = (theme ?? "system") as keyof typeof themeLabels;

  const CurrentIcon = currentTheme === "dark" ? Moon : currentTheme === "light" ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/80 bg-white/80 dark:bg-slate-900/80">
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Ақ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Қара
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Жүйе
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
