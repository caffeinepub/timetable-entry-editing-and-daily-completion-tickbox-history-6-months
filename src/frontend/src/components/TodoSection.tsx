import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useGetAllTasks, useAddTask, useCompleteTask } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export function TodoSection() {
  const { data: tasks = [], isLoading } = useGetAllTasks();
  const addTaskMutation = useAddTask();
  const completeTaskMutation = useCompleteTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('2');

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
      toast.error('Failed to add task');
    }
  };

  const handleToggleComplete = async (taskId: bigint) => {
    try {
      await completeTaskMutation.mutateAsync(taskId);
      toast.success('Task completed!');
    } catch (error) {
      toast.error('Failed to update task');
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
                        disabled={completeTaskMutation.isPending}
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
                      <Checkbox checked={true} disabled />
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
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
