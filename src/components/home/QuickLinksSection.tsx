import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, Settings2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../hooks/useCouple';
import { TOOL_ICONS } from '../tools/constants';
import AddToolModal from '../tools/AddToolModal';

interface Tool {
  id: string;
  title: string;
  url: string;
  icon_key: string;
  sort_order: number;
}

export default function QuickLinksSection() {
  const { couple } = useCouple();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const { data: tools = [], refetch } = useQuery({
    queryKey: ['tools', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const { data, error } = await supabase
        .from('tools')
        .select('id, title, url, icon_key, sort_order')
        .eq('couple_id', couple.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Tool[];
    },
    enabled: !!couple?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ title, url, iconKey }: { title: string, url: string, iconKey: string }) => {
      if (!couple) return;

      if (editingTool) {
        const { error } = await supabase
          .from('tools')
          .update({ title, url, icon_key: iconKey })
          .eq('id', editingTool.id);
        if (error) throw error;
      } else {
        const maxOrder = tools.length > 0 ? Math.max(...tools.map(t => t.sort_order)) : -1;
        const newOrder = maxOrder + 1;

        const { error } = await supabase
          .from('tools')
          .insert({
            couple_id: couple.id,
            title,
            url,
            icon_key: iconKey,
            sort_order: newOrder
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', couple?.id] });
      setIsModalOpen(false);
      setEditingTool(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tools').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', couple?.id] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ currentId, currentOrder, targetId, targetOrder }: any) => {
      const { error: error1 } = await supabase.from('tools').update({ sort_order: targetOrder }).eq('id', currentId);
      const { error: error2 } = await supabase.from('tools').update({ sort_order: currentOrder }).eq('id', targetId);
      if (error1 || error2) throw error1 || error2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', couple?.id] });
    },
  });

  const handleSaveTool = async (title: string, url: string, iconKey: string) => {
    try {
      await saveMutation.mutateAsync({ title, url, iconKey });
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  };

  const handleMoveTool = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tools.length) return;

    const currentTool = tools[index];
    const targetTool = tools[targetIndex];

    try {
      await moveMutation.mutateAsync({
        currentId: currentTool.id,
        currentOrder: currentTool.sort_order,
        targetId: targetTool.id,
        targetOrder: targetTool.sort_order
      });
    } catch (error) {
      console.error('Error moving tool:', error);
      refetch();
    }
  };

  const handleToolClick = (tool: Tool) => {
    if (isEditMode) {
      setEditingTool(tool);
      setIsModalOpen(true);
    } else {
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">둘만의 도구함</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`p-1.5 rounded-lg transition-all ${
            isEditMode ? 'bg-rose-100 text-rose-500' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
          }`}
        >
          <Settings2 size={14} />
        </button>
      </div>

      <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-50 overflow-hidden">
        <div className="flex items-start space-x-5 overflow-x-auto pb-2 no-scrollbar snap-x scroll-smooth">
          {tools.map((tool, index) => {
            const IconComponent = TOOL_ICONS[tool.icon_key] || TOOL_ICONS['globe'];
            return (
              <div key={tool.id} className="flex flex-col items-center flex-shrink-0 snap-start relative group w-[56px]">
                <div className="relative">
                  <button
                    onClick={() => handleToolClick(tool)}
                    className={`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm border border-gray-100 transition-all ${
                      isEditMode ? 'bg-gray-50 ring-2 ring-rose-200' : 'bg-white hover:shadow-md hover:scale-105 active:scale-95'
                    }`}
                  >
                    <IconComponent size={20} className="text-gray-700" />
                    {isEditMode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-[18px] backdrop-blur-[1px]">
                        <Pencil size={12} className="text-rose-600 drop-shadow-sm" />
                      </div>
                    )}
                  </button>

                  {isEditMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white text-rose-500 border border-rose-100 rounded-full flex items-center justify-center shadow-md z-20"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>

                <span className="mt-2 text-[10px] font-bold text-gray-500 text-center truncate w-full px-1">
                  {tool.title}
                </span>

                {isEditMode && (
                  <div className="absolute -bottom-7 flex space-x-1 z-10 bg-white/95 p-1 rounded-full border border-gray-100 shadow-md">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveTool(index, 'left'); }}
                      disabled={index === 0}
                      className="p-1 text-gray-500 disabled:opacity-30 hover:bg-gray-50 rounded-full"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveTool(index, 'right'); }}
                      disabled={index === tools.length - 1}
                      className="p-1 text-gray-500 disabled:opacity-30 hover:bg-gray-50 rounded-full"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-col items-center flex-shrink-0 w-[56px]">
            <button
              onClick={() => {
                setEditingTool(null);
                setIsModalOpen(true);
              }}
              className="w-12 h-12 rounded-[18px] flex items-center justify-center border-2 border-dashed border-gray-100 text-gray-300 hover:border-rose-200 hover:text-rose-400 hover:bg-rose-50 transition-all active:scale-95"
            >
              <Plus size={20} />
            </button>
            <span className="mt-2 text-[10px] font-bold text-gray-300">추가</span>
          </div>
        </div>
      </div>

      <AddToolModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTool(null); }} 
        onAdd={handleSaveTool}
        initialData={editingTool ? { ...editingTool, iconKey: editingTool.icon_key } : null}
      />
    </section>
  );
}
