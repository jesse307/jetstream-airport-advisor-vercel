import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Editor } from '@tinymce/tinymce-react';

interface Template {
  id: string;
  name: string;
  subject: string;
  template_content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateSubject, setEditTemplateSubject] = useState("");
  const [editTemplateContent, setEditTemplateContent] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateContent.trim()) {
      toast.error("Please provide name, subject, and content");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: newTemplateName,
          subject: newTemplateSubject,
          template_content: newTemplateContent,
          is_default: templates.length === 0,
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Template created successfully");
      setNewTemplateName("");
      setNewTemplateSubject("");
      setNewTemplateContent("");
      setIsCreateDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error("Failed to create template");
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate || !editTemplateName.trim() || !editTemplateSubject.trim() || !editTemplateContent.trim()) {
      toast.error("Please provide name, subject, and content");
      return;
    }

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: editTemplateName,
          subject: editTemplateSubject,
          template_content: editTemplateContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      toast.success("Template updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast.success("Template deleted successfully");
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error("Failed to delete template");
    }
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateSubject(template.subject);
    setEditTemplateContent(template.template_content);
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Email Templates</h1>
                <p className="text-sm text-muted-foreground">Manage your email templates</p>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g., Standard Quote Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={newTemplateSubject}
                      onChange={(e) => setNewTemplateSubject(e.target.value)}
                      placeholder="e.g., Your Charter Quote - {{departure_airport}} to {{arrival_airport}}"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template Content</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      Use variables like {`{{first_name}}`}, {`{{last_name}}`}, {`{{departure_airport}}`}, etc.
                    </div>
                    <Editor
                      apiKey="0l83wk5ruzqhx1vqwg8uqyxr3l18k0liqhvn63g3qxuebqkp"
                      value={newTemplateContent}
                      onEditorChange={(content) => setNewTemplateContent(content)}
                      init={{
                        height: 500,
                        menubar: true,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | code',
                        content_style: 'body { font-family:Arial,sans-serif; font-size:14px }'
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate}>
                      Create Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No templates yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        {template.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreviewDialog(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Template Name</Label>
              <Input
                id="edit-name"
                value={editTemplateName}
                onChange={(e) => setEditTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Email Subject</Label>
              <Input
                id="edit-subject"
                value={editTemplateSubject}
                onChange={(e) => setEditTemplateSubject(e.target.value)}
                placeholder="e.g., Your Charter Quote - {{departure_airport}} to {{arrival_airport}}"
              />
            </div>
            <div className="space-y-2">
              <Label>Template Content</Label>
              <Editor
                apiKey="0l83wk5ruzqhx1vqwg8uqyxr3l18k0liqhvn63g3qxuebqkp"
                value={editTemplateContent}
                onEditorChange={(content) => setEditTemplateContent(content)}
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | code',
                  content_style: 'body { font-family:Arial,sans-serif; font-size:14px }'
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTemplate}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div 
              className="border rounded-md p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: selectedTemplate?.template_content || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
