import type { Category } from "@/db/schema";

const CATEGORY_STYLES: Record<Category, string> = {
  짝사랑: "bg-pink text-[var(--color-pink-ink)]",
  일상: "bg-sky text-[var(--color-sky-ink)]",
  불만: "bg-peach text-[var(--color-peach-ink)]",
  감사: "bg-mint text-[var(--color-mint-ink)]",
  기타: "bg-lavender text-[var(--color-lavender-ink)]",
};

export default function CategoryBadge({ category }: { category: Category | null }) {
  if (!category) return null;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category]}`}
    >
      {category}
    </span>
  );
}
