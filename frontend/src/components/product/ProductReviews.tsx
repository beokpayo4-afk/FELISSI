import { Star } from "lucide-react";
import type { ApiReview } from "@/types/catalog";

export function ProductReviews({ reviews }: { reviews: ApiReview[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Reviews</h2>
      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No approved reviews yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-950">
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {review.rating}/5 · {review.customer_name}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment}</p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(review.created_at).toLocaleDateString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
