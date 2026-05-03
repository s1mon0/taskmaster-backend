import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ lists, addList, deleteList }) => {
  const [newListName, setNewListName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newListName.trim()) {
      addList(newListName);
      setNewListName('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">TaskMaster Dashboard</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex justify-center">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
          className="border border-gray-300 rounded-l px-4 py-2 w-64"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600">
          Add List
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map(list => (
          <div key={list.id} className="bg-yellow-200 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">{list.name}</h2>
            <p className="text-sm text-gray-600 mb-4">Created: {new Date(list.created_at).toLocaleDateString()}</p>
            <div className="flex justify-between">
              <Link to={`/list/${list.id}`} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                View Tasks
              </Link>
              <button onClick={() => deleteList(list.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;