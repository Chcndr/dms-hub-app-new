/**
 * AIChatSidebar — Sidebar con storico conversazioni
 * Raggruppamento per data (Oggi, Ieri, Questa settimana, Questo mese, Precedenti)
 */
import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Conversation } from "./types";

interface AIChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  /** Se true, renderizza come pannello dropdown dall'alto (mobile) invece che colonna laterale */
  isMobile?: boolean;
}

function groupByDate(
  conversations: Conversation[]
): Record<string, Conversation[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, Conversation[]> = {};

  for (const conv of conversations) {
    const date = new Date(conv.updated_at || conv.created_at);
    let label: string;

    if (date >= today) {
      label = "Oggi";
    } else if (date >= yesterday) {
      label = "Ieri";
    } else if (date >= weekAgo) {
      label = "Questa settimana";
    } else if (date >= monthAgo) {
      label = "Questo mese";
    } else {
      label = "Precedenti";
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(conv);
  }

  return groups;
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSaveRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5 mx-1 rounded-lg bg-[#1a2332]">
        <input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleSaveRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 text-xs bg-transparent border border-teal-500/30 rounded px-2 py-1 text-[#e8fbff] focus:outline-none focus:border-teal-500"
          autoFocus
        />
        <button
          onClick={handleSaveRename}
          className="p-1 text-teal-400 hover:text-teal-300"
        >
          <Check className="size-3" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1 text-slate-400 hover:text-slate-300"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-all ${
        isActive
          ? "bg-teal-500/15 border border-teal-500/30 text-[#e8fbff]"
          : "hover:bg-[#1a2332] text-slate-300 border border-transparent"
      }`}
      onClick={onClick}
    >
      <MessageSquare className="size-3.5 shrink-0 text-slate-500" />
      <span className="flex-1 text-xs truncate">{conversation.title}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => {
            e.stopPropagation();
            setEditing(true);
            setEditTitle(conversation.title);
          }}
          className="p-1 text-slate-400 hover:text-teal-400 transition-colors"
          title="Rinomina"
        >
          <Pencil className="size-3" />
        </button>
        {confirmDelete ? (
          <>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete();
                setConfirmDelete(false);
              }}
              className="p-1 text-red-400 hover:text-red-300"
              title="Conferma eliminazione"
            >
              <Check className="size-3" />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                setConfirmDelete(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-300"
              title="Annulla"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <button
            onClick={e => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Elimina"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AIChatSidebar({
  conversations,
  activeId,
  isOpen,
  onToggle,
  onSelect,
  onNew,
  onRename,
  onDelete,
  isMobile,
}: AIChatSidebarProps) {
  const grouped = groupByDate(conversations);
  const periodOrder = [
    "Oggi",
    "Ieri",
    "Questa settimana",
    "Questo mese",
    "Precedenti",
  ];

  if (!isOpen) {
    // Su mobile la sidebar chiusa non mostra nulla (il toggle è nell'header)
    if (isMobile) return null;
    return (
      <div className="flex flex-col items-center py-3 px-1 border-r border-slate-700/50 bg-[#0b1220]">
        <button
          onClick={onToggle}
          className="p-2 text-slate-400 hover:text-teal-400 transition-colors"
          title="Apri sidebar"
        >
          <PanelLeft className="size-5" />
        </button>
        <button
          onClick={onNew}
          className="p-2 text-slate-400 hover:text-teal-400 transition-colors mt-2"
          title="Nuova conversazione"
        >
          <Plus className="size-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'w-full max-h-[50vh] border-b' : 'w-64 border-r shrink-0'} border-slate-700/50 flex flex-col bg-[#0b1220]`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
        <Button
          onClick={onNew}
          variant="outline"
          size="sm"
          className="flex-1 bg-teal-600/10 border-teal-500/30 text-teal-400 hover:bg-teal-600/20 hover:text-teal-300"
        >
          <Plus className="size-4 mr-1.5" />
          Nuova chat
        </Button>
        <button
          onClick={onToggle}
          className="p-1.5 text-slate-400 hover:text-teal-400 transition-colors"
          title={isMobile ? "Chiudi" : "Chiudi sidebar"}
        >
          {isMobile ? <X className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {conversations.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-8 px-3">
              Nessuna conversazione.
              <br />
              Inizia una nuova chat!
            </p>
          )}
          {periodOrder.map(period => {
            const convs = grouped[period];
            if (!convs || convs.length === 0) return null;
            return (
              <div key={period} className="mb-2">
                <div className="px-3 py-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {period}
                </div>
                {convs.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeId}
                    onClick={() => onSelect(conv.id)}
                    onRename={title => onRename(conv.id, title)}
                    onDelete={() => onDelete(conv.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
