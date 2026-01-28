import { useState, useEffect } from 'react';
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
  const [tools, setTools] = useState<Tool[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const fetchTools = async () => {
    if (!couple) return;
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('couple_id', couple.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [couple]);

  const handleSaveTool = async (title: string, url: string, iconKey: string) => {
    if (!couple) return;

    try {
      if (editingTool) {
        const { error } = await supabase
          .from('tools')
          .update({ title, url, icon_key: iconKey })
          .eq('id', editingTool.id);

        if (error) throw error;
        
        setTools(tools.map(t => t.id === editingTool.id ? { ...t, title, url, icon_key: iconKey } : t));
        setEditingTool(null);
      } else {
        const maxOrder = tools.length > 0 ? Math.max(...tools.map(t => t.sort_order)) : -1;
        const newOrder = maxOrder + 1;

        const { data, error } = await supabase
          .from('tools')
          .insert({
            couple_id: couple.id,
            title,
            url,
            icon_key: iconKey,
            sort_order: newOrder
          })
          .select()
          .single();

        if (error) throw error;
        setTools([...tools, data]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('tools').delete().eq('id', id);
      if (error) throw error;
      setTools(tools.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  };

  const handleMoveTool = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tools.length) return;

    const currentTool = tools[index];
    const targetTool = tools[targetIndex];

    const newTools = [...tools];
    [newTools[index], newTools[targetIndex]] = [newTools[targetIndex], newTools[index]];
    setTools(newTools);

    try {
      const { error: error1 } = await supabase.from('tools').update({ sort_order: targetTool.sort_order }).eq('id', currentTool.id);
      const { error: error2 } = await supabase.from('tools').update({ sort_order: currentTool.sort_order }).eq('id', targetTool.id);
      if (error1 || error2) throw error1 || error2;
    } catch (error) {
      console.error('Error moving tool:', error);
      fetchTools();
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
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">빠른 이동</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`p-1.5 rounded-full transition-colors ${
            isEditMode ? 'bg-rose-100 text-rose-500' : 'text-gray-300 hover:bg-gray-100'
          }`}
        >
          <Settings2 size={16} />
        </button>
      </div>

      <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-start space-x-4 overflow-x-auto pb-2 custom-scrollbar snap-x">
          {tools.map((tool, index) => {
            const IconComponent = TOOL_ICONS[tool.icon_key] || TOOL_ICONS['globe'];
            return (
              <div key={tool.id} className="flex flex-col items-center flex-shrink-0 snap-start relative group w-[60px]">
                <div className="relative">
                  <button
                    onClick={() => handleToolClick(tool)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 transition-all ${
                      isEditMode ? 'bg-gray-50 ring-2 ring-rose-200' : 'bg-white hover:bg-gray-50 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <IconComponent size={20} className="text-gray-700" />
                    {isEditMode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-2xl backdrop-blur-[1px]">
                        <Pencil size={14} className="text-rose-600 drop-shadow-sm" />
                      </div>
                    )}
                  </button>

                  {isEditMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-rose-500 border border-rose-100 rounded-full flex items-center justify-center shadow-md z-20"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>

                <span className="mt-2 text-[10px] font-medium text-gray-600 text-center truncate w-full px-1">
                  {tool.title}
                </span>

                {isEditMode && (
                  <div className="absolute -bottom-6 flex space-x-1 z-10 bg-white/90 p-0.5 rounded-full border border-gray-100 shadow-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveTool(index, 'left'); }}
                      disabled={index === 0}
                      className="p-0.5 text-gray-500 disabled:opacity-30"
                    >
                      <ChevronLeft size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveTool(index, 'right'); }}
                      disabled={index === tools.length - 1}
                      className="p-0.5 text-gray-500 disabled:opacity-30"
                    >
                      <ChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-col items-center flex-shrink-0 w-[60px]">
            <button
              onClick={() => {
                setEditingTool(null);
                setIsModalOpen(true);
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-400 hover:border-rose-300 hover:text-rose-400 hover:bg-rose-50 transition-all"
            >
              <Plus size={20} />
            </button>
            <span className="mt-2 text-[10px] font-medium text-gray-400">추가</span>
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
