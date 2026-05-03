import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Plus, Trash2, Circle, CheckCircle2, LayoutList } from 'lucide-react';

const API_URL = 'http://localhost:3000';

export default function App() {
  // --- STAV APLIKACE ---
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  
  const [newListName, setNewListName] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- NAČTENÍ DAT Z BACKENDU PŘI STARTU APLIKACE ---
  useEffect(() => {
    fetchData();
  }, []);

  // Načtení úkolů při změně aktivního seznamu
  useEffect(() => {
    if (activeListId) {
      fetchTasks(activeListId);
    } else {
      setTasks([]);
    }
  }, [activeListId]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/list/list`);
      const data = await response.json();
      
      setLists(data.itemList || []);
      
      // Pokud jsme na velkém monitoru a máme seznamy, rovnou první otevřeme
      if (data.itemList && data.itemList.length > 0 && window.innerWidth >= 768) {
        setActiveListId(data.itemList[0].id);
      }
    } catch (error) {
      console.error("Chyba při načítání seznamů:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTasks(listId) {
    try {
      const response = await fetch(`${API_URL}/task/list?listId=${listId}`);
      const data = await response.json();
      setTasks(data.itemList || []);
    } catch (error) {
      console.error("Chyba při načítání úkolů:", error);
    }
  }

  // --- FUNKCE PRO PRÁCI S BACKENDEM ---

  // 1. Vytvoření seznamu
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/list/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() })
      });
      const data = await response.json();

      if (data.list) {
        setLists([...lists, data.list]);
        setNewListName('');
        setActiveListId(data.list.id);
      }
    } catch (error) {
      console.error("Chyba při vytváření seznamu:", error);
    }
  };

  // 2. Smazání seznamu
  const handleDeleteList = async (id, e) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_URL}/list/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();

      if (data.success) {
        const updatedLists = lists.filter(list => list.id !== id);
        setLists(updatedLists);
        
        if (activeListId === id) {
          setActiveListId(updatedLists.length > 0 ? updatedLists[0].id : null);
        }
      }
    } catch (error) {
      console.error("Chyba při mazání seznamu:", error);
    }
  };

  // 3. Přidání úkolu
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeListId) return;
    
    try {
      const response = await fetch(`${API_URL}/task/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: activeListId, text: newTaskText.trim() })
      });
      const data = await response.json();

      if (data.task) {
        setTasks([...tasks, data.task]);
        setNewTaskText('');
      }
    } catch (error) {
      console.error("Chyba při přidávání úkolu:", error);
    }
  };

  // 4. Změna stavu úkolu (Splněno / Nesplněno)
  const handleToggleTask = async (taskToToggle) => {
    const newStatus = !taskToToggle.isCompleted;
    
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.map(task => 
      task.id === taskToToggle.id ? { ...task, isCompleted: newStatus } : task
    ));

    try {
      const response = await fetch(`${API_URL}/task/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskToToggle.id, isCompleted: newStatus })
      });
      const data = await response.json();
      
      if (!data.task) {
        setTasks(previousTasks);
      }
    } catch (error) {
       console.error("Chyba při změně stavu úkolu:", error);
       setTasks(previousTasks);
    }
  };

  // --- FILTROVÁNÍ DAT PRO VYKRESLENÍ ---
  const activeList = lists.find(l => l.id === activeListId);
  const activeTasks = tasks; // Úkoly jsou už vyfiltrované z backendu pro activeListId

  // --- VYKRESLENÍ APLIKACE ---
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f2f2f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007aff]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden text-[#1c1c1e] font-sans">
      
      {/* 1. SLOUPEC: BOČNÍ PANEL (SEZNAMY) */}
      <div className={`w-full md:w-80 lg:w-96 bg-[#f2f2f7] border-r border-gray-200 flex-col h-full ${activeListId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-6 text-gray-800">
            <LayoutList size={28} className="text-[#007aff]" />
            <h1 className="text-2xl font-bold tracking-tight">TaskMaster</h1>
          </div>
          
          <form onSubmit={handleCreateList} className="mb-4 relative">
            <input 
              type="text" 
              placeholder="Nový seznam..." 
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full bg-white rounded-lg py-2.5 pl-3 pr-16 outline-none text-[15px] shadow-sm border border-gray-200 focus:ring-2 focus:ring-[#007aff]/30 transition-all placeholder:text-gray-400"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#007aff] font-semibold text-[15px] active:opacity-50">
              Přidat
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {lists.length === 0 ? (
            <p className="p-4 text-center text-gray-400 text-sm">Žádné seznamy.</p>
          ) : (
            <div className="space-y-1">
              {lists.map((list) => (
                <div 
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    activeListId === list.id 
                      ? 'bg-[#007aff] text-white shadow-md' 
                      : 'hover:bg-gray-200/50 active:bg-gray-300'
                  }`}
                >
                  <span className="text-[15px] font-medium truncate pr-2">{list.name}</span>
                  <button 
                    onClick={(e) => handleDeleteList(list.id, e)} 
                    className={`p-1 rounded-md transition-colors ${
                      activeListId === list.id ? 'text-white/80 hover:bg-white/20' : 'text-gray-400 hover:text-[#ff3b30] hover:bg-gray-200'
                    }`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. SLOUPEC: HLAVNÍ OKNO (ÚKOLY) */}
      <div className={`flex-1 bg-white flex-col h-full relative ${!activeListId ? 'hidden md:flex' : 'flex'}`}>
        {activeListId ? (
          <>
            <div className="p-6 md:px-10 md:pt-10 border-b border-gray-100 flex items-center gap-2">
              <button 
                onClick={() => setActiveListId(null)} 
                className="md:hidden flex items-center text-[#007aff] pr-2 -ml-2 active:opacity-50"
              >
                <ChevronLeft size={28} />
              </button>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight truncate">
                {activeList?.name}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:px-10">
              {activeTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p>Tento seznam je zatím prázdný.</p>
                  <p className="text-sm mt-1">Přidej úkol dole.</p>
                </div>
              ) : (
                <div className="max-w-3xl space-y-1">
                  {activeTasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => handleToggleTask(task)}
                      className="group flex items-center gap-3 p-3 -mx-3 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 size={24} className="text-[#007aff] fill-[#007aff]/10 flex-shrink-0" />
                      ) : (
                        <Circle size={24} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                      )}
                      <span className={`text-[17px] transition-all break-words ${task.isCompleted ? 'text-gray-400 line-through' : 'text-[#1c1c1e]'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 md:px-10 bg-white border-t border-gray-100">
              <form onSubmit={handleAddTask} className="relative max-w-3xl">
                <Plus size={24} className="absolute left-3 top-[22px] -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Přidat nový úkol..." 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="w-full bg-[#f2f2f7] rounded-xl py-3 pl-12 pr-12 outline-none text-[17px] focus:bg-white focus:ring-2 focus:ring-[#007aff]/30 border border-transparent focus:border-[#007aff]/30 transition-all placeholder:text-gray-500"
                />
                <button type="submit" className="absolute right-2 top-[22px] -translate-y-1/2 bg-[#007aff] text-white rounded-lg p-1.5 active:scale-95 transition-transform hover:bg-[#0062cc]">
                  <Plus size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50">
            <div className="text-center">
              <LayoutList size={48} className="mx-auto mb-4 opacity-50 text-[#007aff]" />
              <p className="text-lg">Vyberte seznam vlevo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
