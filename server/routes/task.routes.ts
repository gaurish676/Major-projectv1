import { Router, Request, Response } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskCompletion,
  softDeleteTask,
  restoreTask,
} from '../db/taskDb';

const router = Router();

// GET /api/tasks - Retrieve all tasks with optional filter
router.get('/', (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as string) || 'all';
    const all = getAllTasks();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let filtered = all;
    if (filter === 'today') {
      filtered = all.filter((t) => {
        const due = new Date(t.due_at);
        return due >= startOfToday && due <= endOfToday;
      });
    } else if (filter === 'upcoming') {
      filtered = all.filter((t) => {
        const due = new Date(t.due_at);
        return due > endOfToday;
      });
    } else if (filter === 'completed') {
      filtered = all.filter((t) => t.is_completed === 1);
    }

    res.json({
      success: true,
      tasks: filtered,
      metrics: {
        total: all.length,
        pending: all.filter((t) => t.is_completed === 0).length,
        completed: all.filter((t) => t.is_completed === 1).length,
        completion_rate:
          all.length > 0
            ? Math.round((all.filter((t) => t.is_completed === 1).length / all.length) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve tasks' });
  }
});

// GET /api/tasks/:id - Retrieve single task
router.get('/:id', (req: Request, res: Response) => {
  try {
    const task = getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve task' });
  }
});

// POST /api/tasks - Create new task
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, due_at, category, priority, reminder_on, reminder_offset } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is mandatory' });
    }

    const validCategories = ['Work', 'Personal', 'Study'];
    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];

    const chosenCategory = validCategories.includes(category) ? category : 'Personal';
    const chosenPriority = validPriorities.includes(priority) ? priority : 'MEDIUM';
    const chosenDueAt = due_at || new Date().toISOString();

    const task = createTask({
      title,
      description,
      due_at: chosenDueAt,
      category: chosenCategory,
      priority: chosenPriority,
      reminder_on,
      reminder_offset: typeof reminder_offset === 'number' ? reminder_offset : 15,
    });

    res.status(201).json({ success: true, task, message: 'Task created successfully' });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update existing task
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, due_at, category, priority, reminder_on, reminder_offset, is_completed } = req.body;

    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ success: false, message: 'Task title cannot be empty' });
    }

    const updated = updateTask(id, {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(due_at !== undefined ? { due_at } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(reminder_on !== undefined ? { reminder_on: reminder_on ? 1 : 0 } : {}),
      ...(reminder_offset !== undefined ? { reminder_offset } : {}),
      ...(is_completed !== undefined ? { is_completed: is_completed ? 1 : 0 } : {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, task: updated, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/toggle - Toggle completion status
router.patch('/:id/toggle', (req: Request, res: Response) => {
  try {
    const updated = toggleTaskCompletion(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task: updated });
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle task' });
  }
});

// DELETE /api/tasks/:id - Soft delete (allows undo)
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = softDeleteTask(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/restore - Restore deleted task (Undo action)
router.post('/:id/restore', (req: Request, res: Response) => {
  try {
    const restored = restoreTask(req.params.id);
    if (!restored) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task: restored, message: 'Task restored successfully' });
  } catch (error) {
    console.error('Error restoring task:', error);
    res.status(500).json({ success: false, message: 'Failed to restore task' });
  }
});

export default router;
