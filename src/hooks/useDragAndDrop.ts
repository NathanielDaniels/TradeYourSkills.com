import { useState } from "react";
// import { toast } from "react-hot-toast";

interface UseDragAndDropProps<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  getItemId: (item: T) => string;
  // apiEndpoint?: string;
}

interface DragState {
  draggedItem: string | null;
  dragOverItem: string | null;
}

export function useDragAndDrop<T>({
  items,
  onReorder,
  getItemId,
}: // apiEndpoint,
UseDragAndDropProps<T>) {
  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    dragOverItem: null,
  });

  const handleDragStart = (e: React.DragEvent, item: T) => {
    setDragState({ draggedItem: getItemId(item), dragOverItem: null });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDragState({ draggedItem: null, dragOverItem: null });
  };

  const handleDragOver = (e: React.DragEvent, item: T) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragState((prev) => ({ ...prev, dragOverItem: getItemId(item) }));
  };

  const handleDragLeave = () => {
    setDragState((prev) => ({ ...prev, dragOverItem: null }));
  };

  const handleDrop = async (e: React.DragEvent, targetItem: T) => {
    e.preventDefault();

    const draggedId = dragState.draggedItem;
    const targetId = getItemId(targetItem);

    if (!draggedId || draggedId === targetId) {
      setDragState({ draggedItem: null, dragOverItem: null });
      return;
    }

    // Find the indexes
    const draggedIndex = items.findIndex(
      (item) => getItemId(item) === draggedId
    );
    const targetIndex = items.findIndex((item) => getItemId(item) === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder items locally
    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    const changedItems = newItems
      .map((item, index) => ({
        id: getItemId(item),
        index,
      }))
      .filter(({ id, index }) => {
        const oldItem = items[index];
        return !oldItem || id !== getItemId(oldItem);
      });

    if (changedItems.length === 0) return;

    // Update immediately for smooth UX
    onReorder(newItems);
    setDragState({ draggedItem: null, dragOverItem: null });
  };

  const getDragProps = (item: T) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => handleDragStart(e, item),
    onDragEnd: handleDragEnd,
    onDragOver: (e: React.DragEvent) => handleDragOver(e, item),
    onDragLeave: handleDragLeave,
    onDrop: (e: React.DragEvent) => handleDrop(e, item),
  });

  const getDragStyles = (item: T) => {
    const id = getItemId(item);
    return {
      isDragging: dragState.draggedItem === id,
      isDragOver: dragState.dragOverItem === id,
    };
  };

  return {
    getDragProps,
    getDragStyles,
    isDragging: dragState.draggedItem !== null,
  };
}
