import React from 'react';

const TaskItem = ({ task, toggleTask }) => {
  return (
    <div className={`p-4 rounded shadow cursor-pointer ${task.is_done ? 'bg-blue-100 line-through' : 'bg-blue-200'}`} onClick={() => toggleTask(task.id)}>
      <p className="text-lg">{task.text}</p>
    </div>
  );
};

export default TaskItem;