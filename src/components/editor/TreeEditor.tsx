"use client"

import { useGameStore } from "@/store/gameStore"
import { CustomTreeNode } from "@/types/game"
import { TicTacToeBoard, EightPuzzleBoard } from "../game/Boards"
import { useState } from "react"
import { RotateCcw, MousePointer2, Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

// --- TREE NODE ITEM COMPONENT ---

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
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)

  const [name, setName] = useState(node.name)
  const [value, setValue] = useState(node.value?.toString() || "0")
  const [cost, setCost] = useState(node.costToParent?.toString() || "1")
  const [isGoal, setIsGoal] = useState(node.isGoal || false)

  const handleAdd = () => {
    const id = Math.random().toString(36).substr(2, 9);
    onAdd(node.id, {
      id,
      name: `${t('editor.move_prefix')} ${id.substr(0, 2)}`,
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
                <label className="w-10">{t('editor.node_name')}:</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 border rounded px-1 h-6 bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-10">{t('editor.heuristic')}:</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="flex-1 border rounded px-1 h-6 bg-background"
                />
              </div>
              {!isRoot && (
                <div className="flex items-center gap-2">
                  <label className="w-10">{t('editor.cost')}:</label>
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
                  <span>{t('editor.is_goal')}</span>
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
                <span className="bg-background px-1 rounded border" title={t('editor.heuristic')}>h={node.value}</span>
                {!isRoot && <span className="bg-background px-1 rounded border" title={t('editor.cost')}>g={node.costToParent}</span>}
                {node.isGoal && <span className="bg-green-500 text-white px-1 rounded font-bold">GOAL</span>}
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pt-1">
            <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-accent rounded" title={t('editor.edit_node')}>
              <Edit2 size={14} />
            </button>
            <button onClick={handleAdd} className="p-1 hover:bg-accent rounded" title={t('editor.add_child')}>
              <Plus size={14} />
            </button>
            {!isRoot && (
              <button onClick={() => onRemove(node.id)} className="p-1 hover:bg-destructive/20 text-destructive rounded" title={t('editor.remove_node')}>
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

// --- MAIN TREE EDITOR COMPONENT ---

export function TreeEditor() {
  const { t } = useTranslation()
  const { tree, addNode, removeNode, updateNodeAttributes, problemType } = useGameStore()

  const [ticTacToeTool, setTicTacToeTool] = useState<'X' | 'O' | null>('X');
  const initialTicTacToe = Array(9).fill(null);
  const initial8Puzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];

  const handleTicTacToeClick = (index: number) => {
    const newBoard = [...(tree.boardState || initialTicTacToe)];
    if (newBoard[index] === ticTacToeTool) {
      newBoard[index] = null;
    } else {
      newBoard[index] = ticTacToeTool;
    }
    updateNodeAttributes('root', { boardState: newBoard });
  };

  const handle8PuzzleClick = (index: number) => {
    const newBoard = [...(tree.boardState || initial8Puzzle)];
    const emptyIndex = newBoard.indexOf(0);

    const isAdjacent = (idx1: number, idx2: number) => {
      const r1 = Math.floor(idx1 / 3), c1 = idx1 % 3;
      const r2 = Math.floor(idx2 / 3), c2 = idx2 % 3;
      return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    };

    if (isAdjacent(index, emptyIndex)) {
      [newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]];
      updateNodeAttributes('root', { boardState: newBoard });
    }
  };

  if (problemType === 'tictactoe') {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-black uppercase tracking-widest text-sm">{t('editor.config_board')}</h3>
          <p className="text-xs text-muted-foreground">{t('editor.tictactoe_instr')}</p>
        </div>

        <div className="flex justify-center gap-2 bg-muted p-2 rounded-lg border">
          <button
            onClick={() => setTicTacToeTool('X')}
            className={cn("w-10 h-10 flex items-center justify-center rounded-md font-black text-2xl transition-all",
              ticTacToeTool === 'X' ? 'bg-blue-500 text-white shadow-md ring-2 ring-offset-2 ring-blue-500' : 'bg-background text-blue-500'
            )}
          >
            X
          </button>
          <button
            onClick={() => setTicTacToeTool('O')}
            className={cn("w-10 h-10 flex items-center justify-center rounded-md font-black text-2xl transition-all",
              ticTacToeTool === 'O' ? 'bg-red-500 text-white shadow-md ring-2 ring-offset-2 ring-red-500' : 'bg-background text-red-500'
            )}
          >
            O
          </button>
          <button
            onClick={() => setTicTacToeTool(null)}
            className={cn("w-10 h-10 flex items-center justify-center rounded-md transition-all",
              ticTacToeTool === null ? 'bg-foreground text-background shadow-md ring-2 ring-offset-2 ring-foreground' : 'bg-background text-muted-foreground'
            )}
            title="Limpar Célula"
          >
            <MousePointer2 size={20} />
          </button>
        </div>

        <TicTacToeBoard
          board={tree.boardState || initialTicTacToe}
          onCellClick={handleTicTacToeClick}
          size="lg"
          interactive={true}
        />

        <button
          onClick={() => updateNodeAttributes('root', { boardState: initialTicTacToe })}
          className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg text-xs font-bold hover:bg-accent transition-colors"
        >
          <RotateCcw size={14} /> {t('editor.clear_board')}
        </button>
      </div>
    );
  }

  if (problemType === '8puzzle') {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-black uppercase tracking-widest text-sm">{t('editor.config_board')}</h3>
          <p className="text-xs text-muted-foreground">{t('editor.8puzzle_instr')}</p>
        </div>

        <EightPuzzleBoard
          board={tree.boardState || initial8Puzzle}
          onTileClick={handle8PuzzleClick}
          size="lg"
          interactive={true}
        />

        <button
          onClick={() => updateNodeAttributes('root', { boardState: initial8Puzzle })}
          className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg text-xs font-bold hover:bg-accent transition-colors"
        >
          <RotateCcw size={14} /> {t('editor.reset_positions')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-xl bg-card overflow-auto max-h-[500px]">
      <h3 className="font-semibold mb-4">{t('editor.title')}</h3>
      <TreeNodeItem
        node={tree}
        onAdd={addNode}
        onRemove={removeNode}
        onUpdate={updateNodeAttributes}
        isRoot={true}
      />
    </div>
  )
}
