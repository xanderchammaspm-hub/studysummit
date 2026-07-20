import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";

type Props<T extends { id: string }> = {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  empty?: React.ReactNode;
};

export function DraggableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  empty,
}: Props<T>) {
  const dragId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (items.length === 0 && empty) {
    return <>{empty}</>;
  }

  const handleDrop = (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    setOverId(null);
    if (!from || from === targetId) return;
    const fromIdx = items.findIndex((i) => i.id === from);
    const toIdx = items.findIndex((i) => i.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = items.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
  };

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => {
            dragId.current = item.id;
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== item.id) setOverId(item.id);
          }}
          onDragLeave={() => {
            if (overId === item.id) setOverId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(item.id);
          }}
          onDragEnd={() => {
            dragId.current = null;
            setOverId(null);
          }}
          className={`group flex items-center gap-2 rounded-md border bg-background/40 px-2 py-1.5 transition-colors ${
            overId === item.id
              ? "border-primary/70 bg-primary/5"
              : "border-border/60"
          }`}
        >
          <span
            className="cursor-grab text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
            aria-label="Drag handle"
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">{renderItem(item)}</div>
        </li>
      ))}
    </ul>
  );
}
