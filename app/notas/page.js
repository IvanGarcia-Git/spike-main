"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from "next/link";
import { FaPlus, FaSearch, FaFolder, FaTrash, FaEdit, FaCheck, FaTimes, FaEllipsisV, FaStar, FaFolderPlus, FaHome, FaChevronRight, FaCopy } from 'react-icons/fa';

const NewNoteForm = ({ onAddNote, selectedFolderId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const textareaRef = useRef(null);
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (content.trim() || title.trim()) {
        onAddNote(title || "Sin título", content);
        setTitle('');
        setContent('');
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Crear Nota</h2>
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full mb-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu nota aquí..."
          className="w-full mb-3 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit(e);
              }
          }}
        />
        <button 
          type="submit" 
          disabled={!content.trim() && !title.trim()} 
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          <FaPlus />
          Añadir Nota
        </button>
      </form>
    );
};

const NoteCard = ({ note, folders, onUpdate, onDelete, onToggleFavorite, onCopy, onMove, isDragging }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSave = () => {
    if (content.trim() || title.trim()) {
        onUpdate(note.id, title, content);
        setIsEditing(false);
    } else {
        onDelete(note.id);
    }
  };
  
  const handleCancelEdit = () => {
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  }

  const timeAgo = new Date(note.updatedAt || note.createdAt).toLocaleDateString();

  return (
    <div className={`group relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 h-52 flex flex-col ${isDragging ? 'opacity-50 scale-95' : ''} ${note.isFavorite ? 'border-yellow-400' : ''}`}>
        <button 
          onClick={() => onCopy(note.content)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <FaCopy />
        </button>

        {isEditing ? (
            <>
                <div className="p-4 pb-2">
                    <input 
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full text-lg font-bold p-0 border-none focus:outline-none bg-transparent"
                        placeholder="Título"
                    />
                </div>
                <div className="flex-grow p-4 pt-0">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="h-full w-full resize-none border-none bg-transparent p-0 text-base focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') handleCancelEdit();
                        }}
                    />
                </div>
            </>
        ) : (
            <>
                <div className="p-4 pb-2" onDoubleClick={() => setIsEditing(true)}>
                    <h3 className="text-lg font-semibold break-words pr-8">{note.title}</h3>
                </div>
                <div className="flex-grow p-4 pt-0 overflow-hidden" onDoubleClick={() => setIsEditing(true)}>
                    <p className="whitespace-pre-wrap text-gray-700 break-words">{note.content}</p>
                </div>
            </>
        )}
        
        <div className="flex items-center justify-between border-t p-2">
            <span className="text-xs text-gray-500">{timeAgo}</span>
            
            {isEditing ? (
                 <div className="flex items-center gap-1">
                    <button onClick={handleSave} className="p-1 text-green-500 hover:text-green-600">
                        <FaCheck />
                    </button>
                    <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-600">
                        <FaTimes />
                    </button>
                 </div>
            ) : (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onToggleFavorite(note.id)}
                      className={`p-1 ${note.isFavorite ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-500`}
                    >
                        <FaStar />
                    </button>
                    <div className="relative">
                        <button 
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <FaEllipsisV />
                        </button>
                        {showDropdown && (
                          <div className="absolute right-0 bottom-full mb-1 bg-white border rounded-md shadow-lg z-10 min-w-32">
                            <button 
                              onClick={() => {setIsEditing(true); setShowDropdown(false);}}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FaEdit /> Editar
                            </button>
                            <button 
                              onClick={() => {onDelete(note.id); setShowDropdown(false);}}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                            >
                              <FaTrash /> Eliminar
                            </button>
                          </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default function NotasRapidas() {
    const [notes, setNotes] = useState([]);
    const [folders, setFolders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState('all');
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [editingFolderName, setEditingFolderName] = useState("");
    const [isClient, setIsClient] = useState(false);
    const [showNewNoteForm, setShowNewNoteForm] = useState(false);
    const draggedNoteId = useRef(null);

    useEffect(() => {
        setIsClient(true);
        try {
            const storedNotes = localStorage.getItem('spikes-notes-v3');
            if (storedNotes) setNotes(JSON.parse(storedNotes));
            
            const storedFolders = localStorage.getItem('spikes-folders-v2');
            if (storedFolders) setFolders(JSON.parse(storedFolders));
        } catch (error) {
            console.error("Failed to parse from localStorage", error);
        }
    }, []);

    useEffect(() => {
        if (isClient) {
            localStorage.setItem('spikes-notes-v3', JSON.stringify(notes));
        }
    }, [notes, isClient]);

    useEffect(() => {
        if (isClient) {
            localStorage.setItem('spikes-folders-v2', JSON.stringify(folders));
        }
    }, [folders, isClient]);

    const handleAddNote = (title, content) => {
        const now = Date.now();
        const currentFolderId = selectedFolderId !== 'all' && selectedFolderId !== 'favorites' ? selectedFolderId : null;
        const newNote = {
            id: now.toString(),
            title,
            content,
            isFavorite: false,
            createdAt: now,
            updatedAt: now,
            folderId: currentFolderId,
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
        setShowNewNoteForm(false);
    };

    const handleUpdateNote = (id, newTitle, newContent) => {
        setNotes(notes.map(note => note.id === id ? { ...note, title: newTitle, content: newContent, updatedAt: Date.now() } : note));
    };
    
    const handleDeleteNote = (id) => {
        setNotes(notes.filter(note => note.id !== id));
    };
    
    const handleToggleFavorite = (id) => {
        setNotes(prevNotes => 
            prevNotes.map(note =>
                note.id === id ? { ...note, isFavorite: !note.isFavorite, updatedAt: Date.now() } : note
            )
        );
    };
    
    const handleCopyNote = (content) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(content);
        }
    };

    const handleMoveNote = (noteId, targetFolderId) => {
        setNotes(prevNotes =>
            prevNotes.map(note =>
                note.id === noteId ? { ...note, folderId: targetFolderId, updatedAt: Date.now() } : note
            )
        );
    };
    
    const handleAddFolder = () => {
        const newFolderName = prompt("Introduce el nombre de la nueva carpeta:");
        if (newFolderName && newFolderName.trim()) {
            const parentId = selectedFolderId !== 'all' && selectedFolderId !== 'favorites' ? selectedFolderId : null;
            const newFolder = {
                id: Date.now().toString(),
                name: newFolderName.trim(),
                parentId: parentId,
            };
            const newFolders = [...folders, newFolder];
            setFolders(newFolders);
            setSelectedFolderId(newFolder.id);
        }
    };
    
    const handleStartEditingFolder = (folder) => {
        setEditingFolderId(folder.id);
        setEditingFolderName(folder.name);
    }

    const handleUpdateFolder = () => {
        if (!editingFolderId) return;
        if (!editingFolderName.trim()) return;
        setFolders(folders.map(f => f.id === editingFolderId ? { ...f, name: editingFolderName.trim() } : f));
        setEditingFolderId(null);
        setEditingFolderName("");
    };

    const handleCancelEditFolder = () => {
        setEditingFolderId(null);
        setEditingFolderName("");
    }

    const handleDeleteFolder = (folderId) => {
      const childFolderIds = new Set();
      const findChildren = (fId) => {
        childFolderIds.add(fId);
        const children = folders.filter(f => f.parentId === fId);
        children.forEach(child => findChildren(child.id));
      };
      findChildren(folderId);

      setNotes(notes.map(n => childFolderIds.has(n.folderId || '') ? { ...n, folderId: null } : n));
      setFolders(folders.filter(f => !childFolderIds.has(f.id)));

      if (selectedFolderId && childFolderIds.has(selectedFolderId)) {
          setSelectedFolderId('all');
      }
    };

    const handleDragStart = (id) => {
        draggedNoteId.current = id;
    };

    const handleDrop = (targetId) => {
        if (!draggedNoteId.current || draggedNoteId.current === targetId) return;

        setNotes(prevNotes => {
            const newNotes = [...prevNotes];
            const draggedIndex = newNotes.findIndex(note => note.id === draggedNoteId.current);
            const targetIndex = newNotes.findIndex(note => note.id === targetId);
            if (draggedIndex === -1 || targetIndex === -1) return prevNotes;
            const [draggedItem] = newNotes.splice(draggedIndex, 1);
            newNotes.splice(targetIndex, 0, { ...draggedItem, updatedAt: Date.now() });
            return newNotes;
        });
    };

    const handleDragEnd = () => {
        draggedNoteId.current = null;
    }
    
    const breadcrumbs = useMemo(() => {
      const getPath = (folderId) => {
          if (!folderId || folderId === 'all' || folderId === 'favorites') return [];
          const folder = folders.find(f => f.id === folderId);
          if (!folder) return [];
          return [...getPath(folder.parentId), folder];
      };
      return getPath(selectedFolderId);
    }, [selectedFolderId, folders]);

    const displayedFolders = useMemo(() => {
        if (searchQuery) return [];
        if (selectedFolderId === 'all') {
            return folders.filter(f => f.parentId === null);
        }
        if (selectedFolderId !== 'favorites') {
            return folders.filter(f => f.parentId === selectedFolderId);
        }
        return [];
    }, [folders, selectedFolderId, searchQuery]);

    const displayedNotes = useMemo(() => {
        let filteredNotes;

        if (selectedFolderId === 'favorites') {
            filteredNotes = notes.filter(n => n.isFavorite);
        } else if (selectedFolderId === 'all') {
            filteredNotes = notes;
        } else {
            filteredNotes = notes.filter(n => n.folderId === selectedFolderId);
        }
        
        const sorted = [...filteredNotes].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

        if (!searchQuery) {
            return sorted;
        }

        const allNotes = selectedFolderId === 'all' || selectedFolderId === 'favorites'
            ? notes
            : notes.filter(n => n.folderId === selectedFolderId);

        return allNotes.filter(note =>
            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [notes, searchQuery, selectedFolderId]);
    
    const recentNotes = useMemo(() => {
        return [...notes].sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)).slice(0, 4);
    }, [notes]);

    const topLevelFolders = useMemo(() => folders.filter(f => f.parentId === null), [folders]);

    const getHeaderTitle = () => {
        if (selectedFolderId === 'all') return "Todas las Notas";
        if (selectedFolderId === 'favorites') return "Favoritos";
        const folder = folders.find(f => f.id === selectedFolderId);
        return folder ? folder.name : "Notas";
    };

    if (!isClient) {
        return (
            <div className="flex h-screen">
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="animate-pulse">
                        <div className="h-10 bg-gray-200 rounded mb-8 w-48"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded"></div>)}
                        </div>
                    </div>
                </main>
                <div className="hidden md:block w-80 bg-gray-200 animate-pulse"></div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">{getHeaderTitle()}</h1>
                </header>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <button 
                      onClick={() => setSelectedFolderId('all')}
                      className="p-1 hover:bg-gray-200 rounded flex items-center gap-1"
                    >
                        <FaHome />
                    </button>
                    {breadcrumbs.map(folder => (
                        <React.Fragment key={folder.id}>
                            <FaChevronRight className="text-xs" />
                            <button 
                              onClick={() => setSelectedFolderId(folder.id)}
                              className="hover:underline"
                            >
                                {folder.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {displayedFolders.length > 0 && !searchQuery && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Carpetas</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {displayedFolders.map(folder => (
                                    <div key={folder.id}>
                                    {editingFolderId === folder.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editingFolderName}
                                                onChange={(e) => setEditingFolderName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateFolder();
                                                    if (e.key === 'Escape') handleCancelEditFolder();
                                                }}
                                                autoFocus
                                                className="flex-1 p-2 border rounded"
                                            />
                                            <button onClick={handleUpdateFolder} className="p-2 text-green-600 hover:bg-green-100 rounded">
                                                <FaCheck />
                                            </button>
                                            <button onClick={handleCancelEditFolder} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ) : (
                                    <div
                                        className="group relative flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors bg-white hover:bg-gray-100 border"
                                        onClick={() => setSelectedFolderId(folder.id)}
                                    >
                                        <FaFolder className="text-blue-500" />
                                        <span className="font-medium truncate flex-1">{folder.name}</span>
                                        <div className="opacity-0 group-hover:opacity-100">
                                            <button 
                                              onClick={(e) => {e.stopPropagation(); handleStartEditingFolder(folder);}}
                                              className="p-1 hover:bg-gray-200 rounded mr-1"
                                            >
                                                <FaEdit className="text-xs" />
                                            </button>
                                            <button 
                                              onClick={(e) => {e.stopPropagation(); handleDeleteFolder(folder.id);}}
                                              className="p-1 hover:bg-gray-200 rounded text-red-600"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                    )}
                                    </div>
                                ))}
                            </div>
                    </div>
                )}
                
                {selectedFolderId === 'all' && recentNotes.length > 0 && !searchQuery && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Recientes</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recentNotes.map((note) => (
                                 <div key={note.id}>
                                 <NoteCard
                                    note={note}
                                    folders={folders}
                                    onUpdate={handleUpdateNote}
                                    onDelete={handleDeleteNote}
                                    onToggleFavorite={handleToggleFavorite}
                                    onCopy={handleCopyNote}
                                    onMove={handleMoveNote}
                                    isDragging={false}
                                /></div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-8">
                     <h2 className="text-xl font-bold mb-4">{searchQuery ? 'Resultados de la búsqueda' : 'Notas'}</h2>
                </div>

                {displayedNotes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedNotes.map((note) => (
                            <div
                                key={note.id}
                                draggable
                                onDragStart={() => handleDragStart(note.id)}
                                onDrop={() => handleDrop(note.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnd={handleDragEnd}
                                className="transition-transform duration-200"
                            >
                                <NoteCard
                                    note={note}
                                    folders={folders}
                                    onUpdate={handleUpdateNote}
                                    onDelete={handleDeleteNote}
                                    onToggleFavorite={handleToggleFavorite}
                                    onCopy={handleCopyNote}
                                    onMove={handleMoveNote}
                                    isDragging={draggedNoteId.current === note.id}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
                        {searchQuery ? (
                            <>
                              <h3 className="text-2xl font-semibold mb-2">No se encontraron notas</h3>
                              <p className="text-lg">Intenta con otra búsqueda.</p>
                            </>
                        ) : (
                            <>
                              <h3 className="text-2xl font-semibold mb-2">No hay notas aquí</h3>
                              <p className="text-lg">¡Crea una nota o una carpeta para empezar!</p>
                            </>
                        )}
                    </div>
                )}
            </main>

            <aside className="hidden md:block w-80 bg-white border-l p-4">
                <h1 className="text-2xl font-bold mb-4">Nota Rápida</h1>
                <div className="space-y-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Buscar notas..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                     {showNewNoteForm && <NewNoteForm onAddNote={handleAddNote} selectedFolderId={selectedFolderId} />}
                
                    <div className="relative">
                        <button 
                          onClick={() => setShowNewNoteForm(!showNewNoteForm)}
                          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 mb-2"
                        >
                          <FaPlus /> Nuevo
                        </button>
                        <button 
                          onClick={handleAddFolder}
                          className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 flex items-center justify-center gap-2"
                        >
                          <FaFolderPlus /> Nueva Carpeta
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                      <button 
                        onClick={() => setSelectedFolderId('all')} 
                        className={`w-full text-left p-2 rounded-md hover:bg-gray-100 flex items-center gap-2 ${selectedFolderId === 'all' ? 'bg-blue-100' : ''}`}
                      >
                          <FaHome />
                          Todas las Notas
                      </button>
                       <button 
                        onClick={() => setSelectedFolderId('favorites')} 
                        className={`w-full text-left p-2 rounded-md hover:bg-gray-100 flex items-center gap-2 ${selectedFolderId === 'favorites' ? 'bg-blue-100' : ''}`}
                       >
                           <FaStar />
                           Favoritos
                        </button>
                      {topLevelFolders.length > 0 && <hr className="my-2" />}
                      {topLevelFolders.map((folder) => (
                        <button 
                          key={folder.id}
                          onClick={() => setSelectedFolderId(folder.id)} 
                          className={`w-full text-left p-2 rounded-md hover:bg-gray-100 flex items-center gap-2 ${selectedFolderId === folder.id ? 'bg-blue-100' : ''}`}
                        >
                            <FaFolder />
                            {folder.name}
                        </button>
                      ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}