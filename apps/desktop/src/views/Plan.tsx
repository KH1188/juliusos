import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, updateTaskStatus, getHabits, logHabit } from '../api/client'
import { useState } from 'react'

export default function Plan() {
  const queryClient = useQueryClient()

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(),
  })

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => getHabits(),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const logHabitMutation = useMutation({
    mutationFn: ({ habitId, data }: { habitId: number; data: any }) =>
      logHabit(habitId, data),
    onSuccess: () => {
      alert('Habit logged!')
    },
  })

  const todoTasks = tasks.filter((t: any) => t.status === 'todo')
  const doingTasks = tasks.filter((t: any) => t.status === 'doing')
  const doneTasks = tasks.filter((t: any) => t.status === 'done')

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Plan</h1>

      {/* Task Board */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <TaskColumn
          title="To Do"
          tasks={todoTasks}
          onStatusChange={updateStatus.mutate}
          nextStatus="doing"
        />
        <TaskColumn
          title="Doing"
          tasks={doingTasks}
          onStatusChange={updateStatus.mutate}
          nextStatus="done"
        />
        <TaskColumn
          title="Done"
          tasks={doneTasks}
          onStatusChange={updateStatus.mutate}
          nextStatus="done"
        />
      </div>

      {/* Habits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Habits</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {habits.map((habit: any) => (
            <div key={habit.id} className="border rounded-lg p-4">
              <div className="font-medium mb-2">{habit.name}</div>
              {habit.target && (
                <div className="text-sm text-gray-600 mb-3">
                  Target: {habit.target} {habit.unit}
                </div>
              )}
              <button
                onClick={() =>
                  logHabitMutation.mutate({
                    habitId: habit.id,
                    data: { date: new Date().toISOString(), value: 1 },
                  })
                }
                className="w-full px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Log Today
              </button>
            </div>
          ))}
          {habits.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 py-8">No habits tracked</div>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskColumn({ title, tasks, onStatusChange, nextStatus }: any) {
  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <h3 className="font-bold mb-4 text-gray-700">
        {title} ({tasks.length})
      </h3>
      <div className="space-y-3">
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white p-3 rounded shadow-sm">
            <div className="font-medium mb-2">{task.title}</div>
            {task.notes && <div className="text-sm text-gray-600 mb-2">{task.notes}</div>}
            {nextStatus !== task.status && (
              <button
                onClick={() => onStatusChange({ id: task.id, status: nextStatus })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Move to {nextStatus}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
