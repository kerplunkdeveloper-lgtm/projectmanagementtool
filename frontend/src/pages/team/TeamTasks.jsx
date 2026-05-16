import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTasks, updateTask } from "../../features/tasks/taskSlice";
import { FiCheckSquare } from "react-icons/fi";
import TaskTable from "../tasks/TaskTable";
import TaskModal from "../tasks/TaskModal";

const TeamTasks = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);

  const [openModal, setOpenModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    dispatch(getTasks());
  }, [dispatch]);

  const handleOpenEdit = (task) => {
    setSelectedTask(task);
    setOpenModal(true);
  };

  const handleTaskSubmit = async (formData) => {
    try {
      await dispatch(updateTask({ id: selectedTask._id, taskData: formData })).unwrap();
      setOpenModal(false);
    } catch (err) {
      // handled in slice
    }
  };

  return (
    <div className="p-2 md:p-0">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
          <FiCheckSquare className="text-indigo-400" />
          My Assigned Tasks
        </h1>
        <p className="text-gray-400 mt-1">Manage and update your active tasks</p>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center h-64">
           <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <TaskTable 
          tasks={tasks} 
          onEdit={handleOpenEdit} 
          canManage={false}
        />
      )}

      <TaskModal
        open={openModal}
        setOpen={setOpenModal}
        onSubmit={handleTaskSubmit}
        initialData={selectedTask}
        isEditing={true}
      />
    </div>
  );
};

export default TeamTasks;