import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Circle, Edit2, Trash2, Tag } from 'lucide-react';
import { useGetAllTasks, useAddTask, useUpdateTask, useToggleTaskCompletion, useDeleteTask } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Task } from '../backend';
import { mapBackendError } from '../utils/backendErrorMessage';
import { NoteLinker } from './NoteLinker';

const PRIORITY_COLORS = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
};

const PRIORITY_LABELS = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

export function TodoSection() {
  const { data: tasks = [], isLoading } = useGetAllTasks();
  const addTaskMutation = useAddTask();
  const updateTaskMutation = useUpdateTask();
  const toggleCompletionMutation = useToggleTaskCompletion();
  const deleteTaskMutation = useDeleteTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('3');
  const [tagsInput, setTagsInput] = useState('');
  const [linkedNoteId, setLinkedNoteId] = useState<bigint | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editPriority, setEditPriority] = useState('3');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editLinkedNoteId, setEditLinkedNoteId] = useState<bigint | null>(null);

  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Extract all unique tags from tasks
  const allTags = Array.from(
    new Set(tasks.flatMap(task => task.tags))
  ).sort();

  // Parse tags from comma-separated input
  const parseTags = (input: string): string[] => {
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  const handleAddTask = async () => {
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const tags = parseTags(tagsInput);
      await addTaskMutation.mutateAsync({
        title,
        description,
        subject: subject || 'General',
        priority: BigInt(priority),
        tags,
        noteId: linkedNoteId,
      });
      setTitle('');
      setDescription('');
      setSubject('');
      setPriority('3');
      setTagsInput('');
      setLinkedNoteId(null);
      toast.success('Task added successfully!');
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
    setEditTagsInput(task.tags.join(', '));
    setEditLinkedNoteId(task.noteId || null);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    if (!editTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const tags = parseTags(editTagsInput);
      await updateTaskMutation.mutateAsync({
        taskId: editingTask.id,
        title: editTitle,
        description: editDescription,
        subject: editSubject || 'General',
        priority: BigInt(editPriority),
        tags,
        noteId: editLinkedNoteId,
      });
      setEditingTask(null);
      toast.success('Task updated successfully!');
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleToggleCompletion = async (taskId: bigint) => {
    try {
      await toggleCompletionMutation.mutateAsync(taskId);
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

  // Filter tasks by selected tag
  const filteredTasks = selectedTagFilter
    ? tasks.filter(task => task.tags.includes(selectedTagFilter))
    : tasks;

  const pendingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  const renderTask = (task: Task) => (
    <div
      key={task.id.toString()}
      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <button
        onClick={() => handleToggleCompletion(task.id)}
        className="mt-0.5 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-start gap-2">
          <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </h4>
          <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-2 ${PRIORITY_COLORS[Number(task.priority) as keyof typeof PRIORITY_COLORS]}`} />
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {task.subject}
          </Badge>
          {task.tags.map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
          {task.noteId && (
            <Badge variant="outline" className="text-xs">
              📝 Note linked
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
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
  );

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
            <CardDescription>Create a new task to track your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                placeholder="e.g., Complete math homework"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Additional details..."
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
                  placeholder="e.g., Math"
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
                    <SelectItem value="1">🔴 Urgent</SelectItem>
                    <SelectItem value="2">🟠 High</SelectItem>
                    <SelectItem value="3">🟡 Medium</SelectItem>
                    <SelectItem value="4">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-tags">Tags (comma-separated)</Label>
              <Input
                id="task-tags"
                placeholder="e.g., homework, urgent, chapter-5"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <NoteLinker
              linkedNoteId={linkedNoteId}
              onLink={setLinkedNoteId}
              onUnlink={() => setLinkedNoteId(null)}
              onCreateAndLink={setLinkedNoteId}
            />

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Tasks</CardTitle>
                <CardDescription>Manage your to-do list</CardDescription>
              </div>
              {allTags.length > 0 && (
                <Select
                  value={selectedTagFilter || 'all'}
                  onValueChange={(value) => setSelectedTagFilter(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        <Tag className="mr-1 h-3 w-3 inline" />
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading tasks...</p>
            ) : filteredTasks.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {selectedTagFilter
                  ? `No tasks with tag "${selectedTagFilter}"`
                  : 'No tasks yet. Add your first task!'}
              </p>
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
                <TabsContent value="pending" className="space-y-3 mt-4">
                  {pendingTasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No pending tasks
                    </p>
                  ) : (
                    pendingTasks.map(renderTask)
                  )}
                </TabsContent>
                <TabsContent value="completed" className="space-y-3 mt-4">
                  {completedTasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No completed tasks
                    </p>
                  ) : (
                    completedTasks.map(renderTask)
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update your task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🔴 Urgent</SelectItem>
                    <SelectItem value="2">🟠 High</SelectItem>
                    <SelectItem value="3">🟡 Medium</SelectItem>
                    <SelectItem value="4">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                placeholder="e.g., homework, urgent, chapter-5"
                value={editTagsInput}
                onChange={(e) => setEditTagsInput(e.target.value)}
              />
            </div>
            <NoteLinker
              linkedNoteId={editLinkedNoteId}
              onLink={setEditLinkedNoteId}
              onUnlink={() => setEditLinkedNoteId(null)}
              onCreateAndLink={setEditLinkedNoteId}
            />
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
