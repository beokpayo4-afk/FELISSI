import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchSearchSuggestions } from "@/api/catalog";
import { SearchSuggestionsPanel, suggestionItems } from "@/components/search/SearchSuggestions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import type { SearchSuggestions } from "@/types/catalog";

const emptySuggestions: SearchSuggestions = { products: [], brands: [], categories: [] };

export function SearchBar({
  className,
  inputId,
}: {
  className?: string;
  inputId?: string;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const generatedId = useId();
  const fieldId = inputId ?? generatedId;
  const [query, setQuery] = useState(() => params.get("q") ?? params.get("search") ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState(emptySuggestions);
  const rootRef = useRef<HTMLFormElement>(null);
  const debounced = useDebouncedValue(query.trim(), 300);
  const items = suggestionItems(suggestions);

  useEffect(() => {
    setQuery(params.get("q") ?? params.get("search") ?? "");
  }, [params]);

  useEffect(() => {
    if (debounced.length < 2) {
      setSuggestions(emptySuggestions);
      return;
    }
    const controller = new AbortController();
    fetchSearchSuggestions(debounced, { signal: controller.signal })
      .then((result) => {
        setSuggestions(result);
        setActiveIndex(-1);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions(emptySuggestions);
        }
      });
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  function goToResults(value: string) {
    const next = value.trim();
    setOpen(false);
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeIndex >= 0 && items[activeIndex]) {
      choose(activeIndex);
      return;
    }
    goToResults(query);
  }

  function choose(index: number) {
    const item = items[index];
    if (!item) {
      return;
    }
    setOpen(false);
    if (item.kind === "product") {
      navigate(`/product/${item.slug}`);
      return;
    }
    if (item.kind === "brand") {
      navigate(`/search?q=${encodeURIComponent(item.name)}&brand=${encodeURIComponent(item.slug)}`);
      return;
    }
    navigate(`/search?q=${encodeURIComponent(item.name)}&category=${encodeURIComponent(item.slug)}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || items.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    }
  }

  const showPanel = open && query.trim().length >= 2 && debounced.length >= 2;

  return (
    <form
      ref={rootRef}
      onSubmit={onSubmit}
      role="search"
      className={cn("relative w-full", className)}
    >
      <label htmlFor={fieldId} className="sr-only">
        Search electronics
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={fieldId}
          name="q"
          type="search"
          value={query}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={`${fieldId}-suggestions`}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search name, SKU, brand, or category"
          className="h-11 w-full rounded-full border border-line bg-cream-50 pr-24 pl-10 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-full bg-sky-600 px-4 text-xs font-semibold text-white hover:bg-sky-700"
        >
          Search
        </button>
      </div>
      {showPanel ? (
        <div
          id={`${fieldId}-suggestions`}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
        >
          {debounced !== query.trim() ? (
            <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
          ) : (
            <SearchSuggestionsPanel
              suggestions={suggestions}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onSelectProduct={(slug) => {
                setOpen(false);
                navigate(`/product/${slug}`);
              }}
              onSelectBrand={(slug, name) => {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(name)}&brand=${encodeURIComponent(slug)}`);
              }}
              onSelectCategory={(slug, name) => {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(name)}&category=${encodeURIComponent(slug)}`);
              }}
            />
          )}
        </div>
      ) : null}
    </form>
  );
}
