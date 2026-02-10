import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { TaskCompletionHeatmap } from './TaskCompletionHeatmap';

interface SubTopic {
  id: string;
  label: string;
  completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  subTopics: SubTopic[];
}

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: '1',
    name: 'Mathematics',
    subTopics: [
      { id: '1-1', label: 'Algebra', completed: false },
      { id: '1-2', label: 'Calculus', completed: false },
      { id: '1-3', label: 'Geometry', completed: false },
    ],
  },
  {
    id: '2',
    name: 'Physics',
    subTopics: [
      { id: '2-1', label: 'Mechanics', completed: false },
      { id: '2-2', label: 'Thermodynamics', completed: false },
      { id: '2-3', label: 'Electromagnetism', completed: false },
    ],
  },
  {
    id: '3',
    name: 'Chemistry',
    subTopics: [
      { id: '3-1', label: 'Organic Chemistry', completed: false },
      { id: '3-2', label: 'Inorganic Chemistry', completed: false },
      { id: '3-3', label: 'Physical Chemistry', completed: false },
    ],
  },
];

export function SyllabusTrackerSection() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('syllabusSubjects');
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [examDate, setExamDate] = useState<string>(() => {
    return localStorage.getItem('examDate') || '';
  });

  const [examTime, setExamTime] = useState<string>(() => {
    return localStorage.getItem('examTime') || '09:00';
  });

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExamDateDialogOpen, setIsExamDateDialogOpen] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubTopics, setNewSubTopics] = useState(['', '', '']);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0 });

  useEffect(() => {
    localStorage.setItem('syllabusSubjects', JSON.stringify(subjects));
    updateDailyCheckoffState(subjects);
  }, [subjects]);

  useEffect(() => {
    if (examDate) {
      localStorage.setItem('examDate', examDate);
    }
    if (examTime) {
      localStorage.setItem('examTime', examTime);
    }
  }, [examDate, examTime]);

  useEffect(() => {
    if (!examDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const exam = new Date(`${examDate}T${examTime}`);
      const diff = exam.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setCountdown({ days, hours });
      } else {
        setCountdown({ days: 0, hours: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [examDate, examTime]);

  const updateDailyCheckoffState = (currentSubjects: Subject[]) => {
    const today = new Date().toLocaleDateString('en-CA');
    const storageKey = `syllabusCheckoff_${today}`;
    
    const checkedCount = currentSubjects.reduce((total, subject) => {
      return total + subject.subTopics.filter(st => st.completed).length;
    }, 0);

    localStorage.setItem(storageKey, checkedCount.toString());
  };

  const handleToggleSubTopic = (subjectId: string, subTopicId: string) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              subTopics: subject.subTopics.map((st) =>
                st.id === subTopicId ? { ...st, completed: !st.completed } : st
              ),
            }
          : subject
      )
    );
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    const filledSubTopics = newSubTopics.filter((st) => st.trim() !== '');
    if (filledSubTopics.length !== 3) {
      toast.error('Please enter exactly 3 sub-topics');
      return;
    }

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: newSubjectName.trim(),
      subTopics: filledSubTopics.map((label, index) => ({
        id: `${Date.now()}-${index}`,
        label: label.trim(),
        completed: false,
      })),
    };

    setSubjects((prev) => [...prev, newSubject]);
    setNewSubjectName('');
    setNewSubTopics(['', '', '']);
    setIsAddDialogOpen(false);
    toast.success('Subject added successfully');
  };

  const handleEditSubject = () => {
    if (!editingSubject) return;

    if (!editingSubject.name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    const filledSubTopics = editingSubject.subTopics.filter((st) => st.label.trim() !== '');
    if (filledSubTopics.length !== 3) {
      toast.error('Please enter exactly 3 sub-topics');
      return;
    }

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === editingSubject.id
          ? {
              ...editingSubject,
              subTopics: editingSubject.subTopics.map((st) => ({
                ...st,
                label: st.label.trim(),
              })),
            }
          : subject
      )
    );

    setEditingSubject(null);
    setIsEditDialogOpen(false);
    toast.success('Subject updated successfully');
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId));
    toast.success('Subject deleted successfully');
  };

  const handleSaveExamDate = () => {
    if (!examDate) {
      toast.error('Please select an exam date');
      return;
    }
    setIsExamDateDialogOpen(false);
    toast.success('Exam date saved successfully');
  };

  const calculateProgress = (subject: Subject): number => {
    const completed = subject.subTopics.filter((st) => st.completed).length;
    return (completed / subject.subTopics.length) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Syllabus Tracker</CardTitle>
            </div>
            <div className="flex gap-2">
              <Dialog open={isExamDateDialogOpen} onOpenChange={setIsExamDateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Set Exam Date
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Exam Date & Time</DialogTitle>
                    <DialogDescription>Choose when your exam is scheduled</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="exam-date">Exam Date</Label>
                      <Input
                        id="exam-date"
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam-time">Exam Time</Label>
                      <Input
                        id="exam-time"
                        type="time"
                        value={examTime}
                        onChange={(e) => setExamTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveExamDate}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                    <DialogDescription>Create a new subject with 3 sub-topics</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject-name">Subject Name</Label>
                      <Input
                        id="subject-name"
                        placeholder="e.g., Biology"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                      />
                    </div>
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`subtopic-${index}`}>Sub-topic {index + 1}</Label>
                        <Input
                          id={`subtopic-${index}`}
                          placeholder={`e.g., Topic ${index + 1}`}
                          value={newSubTopics[index]}
                          onChange={(e) => {
                            const updated = [...newSubTopics];
                            updated[index] = e.target.value;
                            setNewSubTopics(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSubject}>Add Subject</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <CardDescription>Track your exam preparation progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {examDate && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Exam Countdown</p>
                      <p className="text-2xl font-bold">
                        {countdown.days} days, {countdown.hours} hours
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(`${examDate}T${examTime}`).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        at {examTime}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSubject(subject);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{subject.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <Progress value={calculateProgress(subject)} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {subject.subTopics.filter((st) => st.completed).length} / {subject.subTopics.length} completed
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subject.subTopics.map((subTopic) => (
                      <div key={subTopic.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={subTopic.id}
                          checked={subTopic.completed}
                          onCheckedChange={() => handleToggleSubTopic(subject.id, subTopic.id)}
                        />
                        <label
                          htmlFor={subTopic.id}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${
                            subTopic.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {subTopic.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <TaskCompletionHeatmap />

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update the subject name and sub-topics</DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject-name">Subject Name</Label>
                <Input
                  id="edit-subject-name"
                  value={editingSubject.name}
                  onChange={(e) =>
                    setEditingSubject({ ...editingSubject, name: e.target.value })
                  }
                />
              </div>
              {editingSubject.subTopics.map((subTopic, index) => (
                <div key={subTopic.id} className="space-y-2">
                  <Label htmlFor={`edit-subtopic-${index}`}>Sub-topic {index + 1}</Label>
                  <Input
                    id={`edit-subtopic-${index}`}
                    value={subTopic.label}
                    onChange={(e) => {
                      const updated = { ...editingSubject };
                      updated.subTopics[index].label = e.target.value;
                      setEditingSubject(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubject}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
