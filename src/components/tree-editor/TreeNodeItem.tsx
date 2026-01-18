"use client"

import { useState } from "react"
import { CustomTreeNode } from "@/store/gameStore"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreeNodeItemProps {
  node: CustomTreeNode
  onAdd: (parentId: string, node: CustomTreeNode) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, attrs: Partial<CustomTreeNode>) => void
  isRoot?: boolean
}

export function TreeNodeItem({ 
  node, 
  onAdd, 
  onRemove, 
  onUpdate, 
  isRoot = false 
}: TreeNodeItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  // Estados locais para edição
  const [name, setName] = useState(node.name)
  const [value, setValue] = useState(node.value?.toString() || "0")
  const [cost, setCost] = useState(node.costToParent?.toString() || "1")
  const [isGoal, setIsGoal] = useState(node.isGoal || false)

  const handleAdd = () => {
    const id = Math.random().toString(36).substr(2, 9);
    onAdd(node.id, {
      id,
      name: `Node ${id.substr(0,2)}`,
      value: 0,
      children: [],
      costToParent: 1,
      isGoal: false
    })
  }

  const handleSave = () => {
    onUpdate(node.id, {
      name,
      value: Number(value),
      costToParent: Number(cost),
      isGoal
    })
    setIsEditing(false)
  }

  return (
    <div className="ml-4 border-l pl-4 py-2">
      <div className="flex items-start gap-2 group">
        <div className={cn(
          "flex flex-col gap-2 p-2 rounded-md border transition-colors",
          isGoal ? "bg-green-500/10 border-green-500/50" : "bg-muted/50",
          isEditing ? "w-full max-w-[250px]" : ""
        )}>
          
          {isEditing ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <label className="w-10">Nome:</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 border rounded px-1 h-6 bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-10">Heur(h):</label>
                <input 
                  type="number"
                  value={value} 
                  onChange={(e) => setValue(e.target.value)}
                  className="flex-1 border rounded px-1 h-6 bg-background"
                />
              </div>
              {!isRoot && (
                <div className="flex items-center gap-2">
                  <label className="w-10">Custo(g):</label>
                  <input 
                    type="number"
                    value={cost} 
                    onChange={(e) => setCost(e.target.value)}
                    className="flex-1 border rounded px-1 h-6 bg-background"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isGoal}
                    onChange={(e) => setIsGoal(e.target.checked)}
                  />
                  <span>É Objetivo?</span>
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleSave} className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"><Check size={14} /></button>
                <button onClick={() => setIsEditing(false)} className="p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"><X size={14} /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold">{node.name}</span>
              <div className="flex gap-1 text-[10px] text-muted-foreground">
                <span className="bg-background px-1 rounded border" title="Heurística">h={node.value}</span>
                {!isRoot && <span className="bg-background px-1 rounded border" title="Custo do Pai">g={node.costToParent}</span>}
                {node.isGoal && <span className="bg-green-500 text-white px-1 rounded font-bold">GOAL</span>}
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pt-1">
            <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-accent rounded" title="Editar">
              <Edit2 size={14} />
            </button>
            <button onClick={handleAdd} className="p-1 hover:bg-accent rounded" title="Adicionar Filho">
              <Plus size={14} />
            </button>
            {!isRoot && (
              <button onClick={() => onRemove(node.id)} className="p-1 hover:bg-destructive/20 text-destructive rounded" title="Remover">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-1">
        {node.children.map(child => (
          <TreeNodeItem 
            key={child.id} 
            node={child} 
            onAdd={onAdd} 
            onRemove={onRemove} 
            onUpdate={onUpdate} 
          />
        ))}
      </div>
    </div>
  )
}
