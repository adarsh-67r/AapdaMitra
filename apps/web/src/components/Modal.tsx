"use client";
import { CloseIcon } from "@/components/icons";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
          <span className="text-base font-semibold">{title}</span>
          <button onClick={onClose} className="text-text-muted hover:text-text cursor-pointer text-lg leading-none">
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
