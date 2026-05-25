import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? 'var(--surface2)' : 'var(--surface)',
  }
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 10,
        border: '1px solid var(--border)',
        marginBottom: 6,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab', background: 'transparent', border: 'none',
          color: 'var(--text3)', padding: 4,
        }}
        aria-label="Réordonner"
      >
        <GripVertical size={16} />
      </button>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

/**
 * Liste réordonnable par drag & drop.
 * @param {Object} props
 * @param {Array<{ id: string }>} props.items
 * @param {(newOrder: Array) => void} props.onReorder
 * @param {(item: any) => React.ReactNode} props.renderItem
 */
export default function SortableList({ items, onReorder, renderItem }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
