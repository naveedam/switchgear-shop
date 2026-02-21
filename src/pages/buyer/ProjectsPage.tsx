import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, FileText, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectService } from '@/hooks/useProjectService';
import { Project } from '@/types/project';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  bom_generated: 'bg-yellow-100 text-yellow-800',
  rfq_created: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  bom_generated: 'BOM Generated',
  rfq_created: 'RFQ Created',
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProjects, createProject, deleteProject } = useProjectService();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (user?.id) loadProjects();
  }, [user?.id]);

  const loadProjects = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await getProjects(user.id);
    setProjects(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user?.id || !newName.trim()) return;
    const project = await createProject(user.id, newName.trim(), newDesc.trim() || undefined);
    if (project) {
      setDialogOpen(false);
      setNewName('');
      setNewDesc('');
      navigate(`/buyer/projects/${project.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (await deleteProject(id)) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <Container className="py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Smart BOM Builder</h1>
            <p className="text-muted-foreground mt-1">
              Upload design documents, extract components with AI, and create RFQs
            </p>
            <Badge variant="outline" className="mt-2 text-xs">Beta</Badge>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., MCC Panel - Building A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Brief description of the project..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!newName.trim()}>
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info banner */}
        <Card className="mb-6 bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <div className="flex gap-3 text-sm text-muted-foreground">
              <FileText className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">How it works</p>
                <p>1. Create a project → 2. Upload design PDF/Excel → 3. AI extracts components → 4. Review & edit BOM → 5. Convert to RFQ</p>
                <p className="mt-1 text-xs italic">AI-generated suggestions require review before RFQ creation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to start building a BOM from design documents.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/buyer/projects/${project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={statusColors[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString('en-IN')}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => { e.stopPropagation(); handleDelete(project.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ProjectsPage;
