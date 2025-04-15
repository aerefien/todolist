"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../app/lib/firebase";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTime: { [key: string]: string } = {};
      tasks.forEach((task) => {
        updatedTime[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(updatedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const diff = target - now;

    if (diff <= 0) return "Waktu habis!";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}j ${minutes}m ${seconds}s`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: "Tambahkan Tugas Baru",
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nama tugas">
        <input id="swal-input2" type="datetime-local" class="swal2-input">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Tambah",
      cancelButtonText: "Batal",
      preConfirm: () => [
        (document.getElementById("swal-input1") as HTMLInputElement)?.value,
        (document.getElementById("swal-input2") as HTMLInputElement)?.value,
      ],
    });

    if (formValues?.[0] && formValues?.[1]) {
      const newTask: Omit<Task, "id"> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, "tasks"), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
      Swal.fire("Sukses!", "Tugas berhasil ditambahkan.", "success");
    }
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Tugas",
      html: `
        <input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">
        <input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      preConfirm: () => [
        (document.getElementById("swal-input1") as HTMLInputElement)?.value,
        (document.getElementById("swal-input2") as HTMLInputElement)?.value,
      ],
    });

    if (formValues?.[0] && formValues?.[1]) {
      const updatedTask = {
        ...task,
        text: formValues[0],
        deadline: formValues[1],
      };

      await updateDoc(doc(db, "tasks", task.id), {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
      Swal.fire("Berhasil!", "Tugas berhasil diperbarui.", "success");
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "tasks", id));
    setTasks(tasks.filter((task) => task.id !== id));
    Swal.fire("Dihapus!", "Tugas berhasil dihapus.", "success");
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-700 to-gray-100 py-12 px-4 flex justify-center items-center">
      <div className="max-w-2xl w-full backdrop-blur-lg bg-white/30 shadow-2xl rounded-3xl p-8 border border-white/20">
        <h1 className="text-5xl font-extrabold text-white text-center mb-8 tracking-tight">
          📚 To-Do List
        </h1>

        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            className="bg-gradient-to-r from-white to-gray-600 
  hover:from-gray-100 hover:to-gray-700 text-gray-800 
  px-8 py-3 rounded-full font-semibold shadow-md 
  transition duration-300 ease-in-out transform hover:scale-105"
          >
            + Tambah Tugas
          </button>
        </div>

        <ul className="space-y-4">
          <AnimatePresence>
            {tasks.map((task) => {
              const isExpired =
                calculateTimeRemaining(task.deadline) === "Waktu habis!";
              const taskColor = task.completed
                ? "bg-green-100/40 border-green-400"
                : isExpired
                ? "bg-red-100/40 border-red-400"
                : "bg-yellow-100/40 border-yellow-400";

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className={`border-l-4 ${taskColor} border p-4 rounded-2xl shadow-lg backdrop-blur-sm`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p
                        onClick={() => toggleTask(task.id)}
                        className={`text-lg font-semibold cursor-pointer mb-1 ${
                          task.completed
                            ? "line-through text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        {task.text}
                      </p>
                      <p className="text-sm text-gray-600">
                        ⏰ Deadline: {new Date(task.deadline).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        ⏳ {timeRemaining[task.id] || "Menghitung..."}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => editTask(task)}
                        className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-white hover:bg-gray-100 t ext-gray-700 text-sm px-3 py-1 rounded-md border border-gray-300"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
