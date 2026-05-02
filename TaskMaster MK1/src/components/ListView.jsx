import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TaskItem from './TaskItem';

const ListView = ({ lists, tasks, addTask, toggleTask }) => {
  const { id } = useParams();
  const listId = parseInt(id);
  const list = lists.find(l => l.id === listId);
  const listTasks = tasks.filter(t => t.list_id === listId);

  const [newTaskText, setNewTaskText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      addTask(listId, newTaskText);
      setNewTaskText('');
    }
  };

  if (!list) return <div>List not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6">{list.name}</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex justify-center">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="New task"
          className="border border-gray-300 rounded-l px-4 py-2 w-64"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600">
          Add Task
        </button>
      </form>
      <div className="space-y-2">
        {listTasks.map(task => (
          <TaskItem key={task.id} task={task} toggleTask={toggleTask} />
        ))}
      </div>
    </div>
  );
};

export default ListView;