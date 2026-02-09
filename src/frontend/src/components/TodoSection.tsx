import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useGetAllTasks, useAddTask, useToggleTaskCompletion, useUpdateTask, useDeleteTask } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Task } from '../backend';
import { mapBackendError } from '../utils/backendErrorMessage';

export function TodoSection() {
  const { data: tasks = [], isLoading } = useGetAllTasks();
  const addTaskMutation = useAddTask();
  const toggleTaskMutation = useToggleTaskCompletion();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('2');

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editPriority, setEditPriority] = useState('2');

  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const handleAddTask = async () => {
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await addTaskMutation.mutateAsync({
        title,
        description,
        subject: subject || 'General',
        priority: BigInt(priority),
      });
      setTitle('');
      setDescription('');
      setSubject('');
      setPriority('2');
      toast.success('Task added successfully!');
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleToggleComplete = async (taskId: bigint) => {
    try {
      await toggleTaskMutation.mutateAsync(taskId);
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditSubject(task.subject);
    setEditPriority(task.priority.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    if (!editTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        taskId: editingTask.id,
        title: editTitle,
        description: editDescription,
        subject: editSubject || 'General',
        priority: BigInt(editPriority),
      });
      setEditingTask(null);
      toast.success('Task updated successfully!');
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      await deleteTaskMutation.mutateAsync(deletingTask.id);
      setDeletingTask(null);
      toast.success('Task deleted successfully!');
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const getPriorityColor = (priority: bigint) => {
    const p = Number(priority);
    if (p === 1) return 'destructive';
    if (p === 2) return 'default';
    return 'secondary';
  };

  const getPriorityLabel = (priority: bigint) => {
    const p = Number(priority);
    if (p === 1) return 'High';
    if (p === 2) return 'Medium';
    return 'Low';
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
            <CardDescription>Create a new study task or assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                placeholder="e.g., Complete Chapter 5 exercises"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Add details about the task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-subject">Subject</Label>
                <Input
                  id="task-subject"
                  placeholder="e.g., Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAddTask}
              disabled={addTaskMutation.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {addTaskMutation.isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>Manage your study tasks and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-center text-muted-foreground">No tasks yet. Add your first task!</p>
            ) : (
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pending">
                    Pending ({pendingTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({completedTasks.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-3">
                  {pendingTasks.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      No pending tasks
                    </p>
                  ) : (
                    pendingTasks.map((task) => (
                      <div
                        key={task.id.toString()}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task.id)}
                          disabled={toggleTaskMutation.isPending}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Subject: {task.subject}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingTask(task)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-3">
                  {completedTasks.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      No completed tasks yet
                    </p>
                  ) : (
                    completedTasks.map((task) => (
                      <div
                        key={task.id.toString()}
                        className="flex items-start gap-3 rounded-lg border p-3 opacity-60"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task.id)}
                          disabled={toggleTaskMutation.isPending}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium line-through">{task.title}</h4>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-through">
                              {task.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Subject: {task.subject}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingTask(task)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update your task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-title">Title *</Label>
              <Input
                id="edit-task-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Complete Chapter 5 exercises"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add details about the task..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-task-subject">Subject</Label>
                <Input
                  id="edit-task-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-priority">Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger id="edit-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
