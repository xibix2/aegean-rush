"use client";

type Props = {
  label?: string;
  confirmText?: string;
};

export default function ConfirmDeleteButton({
  label = "Delete",
  confirmText = "Are you sure you want to delete this item? This action cannot be undone.",
}: Props) {
  return (
    <button
      type="submit"
      className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs
                 border-rose-400/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15 transition"
      onClick={(e) => {
        if (!confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}