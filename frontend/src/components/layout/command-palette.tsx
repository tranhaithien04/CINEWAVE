"use client";

import { Command } from "cmdk";
import { Clapperboard, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";

export const SEARCH_EVENT = "cinewave:search";

export function openCommandPalette() {
  window.dispatchEvent(new Event(SEARCH_EVENT));
}

export function CommandPalette() {
  const router = useRouter();
  const { movies } = useCatalog();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    function onSearch() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(SEARCH_EVENT, onSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SEARCH_EVENT, onSearch);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden border-white/10 p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Tìm phim</DialogTitle>
        <Command label="Tìm phim" className="bg-transparent text-gray-200">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 pr-12">
            <Search className="h-4 w-4 text-cyan-400" strokeWidth={1.75} />
            <Command.Input
              placeholder="Tìm phim theo tên hoặc thể loại…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-gray-500">Không thấy phim phù hợp.</Command.Empty>
            <Command.Group heading="Phim" className="px-1 text-xs uppercase tracking-wider text-cyan-400/80">
              {movies.map((movie) => (
                <Command.Item
                  key={movie.id}
                  value={`${movie.title} ${movie.genres.join(" ")} ${movie.slug}`}
                  onSelect={() => {
                    setOpen(false);
                    router.push(paths.movie(movie.slug));
                  }}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-200 data-[selected=true]:bg-cyan-500/10 data-[selected=true]:text-white"
                >
                  <Clapperboard className="h-4 w-4 text-cyan-400" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate font-medium">{movie.title}</span>
                  <span className="text-[10px] text-gray-500">{movie.rating}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
