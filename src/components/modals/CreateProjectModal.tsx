
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useFontContext } from '@/context/FontContext';
import { supabase } from '@/integrations/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { User, ExternalLink, Plus, Image, Upload, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schema for personal project
const personalProjectSchema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  month: z.date().optional(),
  year: z.number().min(1900).max(2100).optional(),
  duration: z.string().optional(),
  field: z.string().min(1, { message: "Field is required" }),
  coAuthors: z.string().optional(),
  externalLinks: z.string().optional(),
});

// Schema for external reference
const externalReferenceSchema = z.object({
  name: z.string().min(1, { message: "Reference name is required" }),
  month: z.date().optional(),
  year: z.number().min(1900).max(2100).optional(),
  duration: z.string().optional(),
  field: z.string().min(1, { message: "Field is required" }),
  authors: z.string().optional(),
  externalLinks: z.string().min(1, { message: "At least one external link is required" }),
});

type PersonalProjectFormValues = z.infer<typeof personalProjectSchema>;
type ExternalReferenceFormValues = z.infer<typeof externalReferenceSchema>;

interface CreateProjectModalProps {
  children?: React.ReactNode;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const { addProject } = useFontContext();

  // Form for personal project
  const personalForm = useForm<PersonalProjectFormValues>({
    resolver: zodResolver(personalProjectSchema),
    defaultValues: {
      name: "",
      duration: "",
      field: "",
      coAuthors: "",
      externalLinks: "",
    },
  });

  // Form for external reference
  const externalForm = useForm<ExternalReferenceFormValues>({
    resolver: zodResolver(externalReferenceSchema),
    defaultValues: {
      name: "",
      duration: "",
      field: "",
      authors: "",
      externalLinks: "",
    },
  });

  const onSubmitPersonal = async (values: PersonalProjectFormValues) => {
    try {
      // Format the date information if provided
      let description = "";
      
      if (values.field) {
        description += `Field: ${values.field}\n`;
      }
      
      if (values.month) {
        description += `Date: ${format(values.month, 'MMMM')}`;
        if (values.year) {
          description += ` ${values.year}`;
        }
        description += "\n";
      } else if (values.year) {
        description += `Year: ${values.year}\n`;
      }
      
      if (values.duration) {
        description += `Duration: ${values.duration}\n`;
      }
      
      if (values.coAuthors) {
        description += `Co-authors: ${values.coAuthors}\n`;
      }
      
      if (values.externalLinks) {
        description += `External Links: ${values.externalLinks}\n`;
      }
      
      await addProject({
        name: values.name,
        description: description.trim(),
      });
      
      toast.success("Project created successfully!");
      setOpen(false);
      personalForm.reset();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const onSubmitExternal = async (values: ExternalReferenceFormValues) => {
    try {
      // Create the project first
      let description = "External Reference\n";
      
      if (values.field) {
        description += `Field: ${values.field}\n`;
      }
      
      if (values.month) {
        description += `Date: ${format(values.month, 'MMMM')}`;
        if (values.year) {
          description += ` ${values.year}`;
        }
        description += "\n";
      } else if (values.year) {
        description += `Year: ${values.year}\n`;
      }
      
      if (values.duration) {
        description += `Duration: ${values.duration}\n`;
      }
      
      if (values.authors) {
        description += `Authors: ${values.authors}\n`;
      }
      
      await addProject({
        name: values.name,
        description: description.trim(),
      });
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to add external references');
        return;
      }
      
      // Store external links in the external_references table
      // This would typically be done in a separate function or context
      // For simplicity, we're doing it directly here
      const links = values.externalLinks.split(",").map(link => link.trim());
      
      for (const url of links) {
        if (url) {
          const { error } = await supabase
            .from('external_references')
            .insert({
              url,
              project_name: values.name,
              user_id: session.user.id
            });
            
          if (error) {
            console.error("Error adding external reference:", error);
            toast.error("Failed to add external reference");
          }
        }
      }
      
      toast.success("External reference created successfully!");
      setOpen(false);
      externalForm.reset();
    } catch (error) {
      console.error("Error creating external reference:", error);
      toast.error("Failed to create external reference");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Project</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="personal" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Personal Project
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center">
              <ExternalLink className="mr-2 h-4 w-4" />
              External Reference
            </TabsTrigger>
          </TabsList>
          
          {/* Personal Project Form */}
          <TabsContent value="personal" className="space-y-4">
            <Form {...personalForm}>
              <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-4">
                <FormField
                  control={personalForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="My Font Project" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={personalForm.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Month</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MMMM")
                                ) : (
                                  <span>Pick a month</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2023" 
                            {...field} 
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={personalForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="3 months" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalForm.control}
                    name="field"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field *</FormLabel>
                        <FormControl>
                          <Input placeholder="Web Design" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={personalForm.control}
                  name="coAuthors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Co-authors</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe, Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalForm.control}
                  name="externalLinks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Links</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="https://example.com, https://myportfolio.com/project" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Personal Project</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* External Reference Form */}
          <TabsContent value="external" className="space-y-4">
            <Form {...externalForm}>
              <form onSubmit={externalForm.handleSubmit(onSubmitExternal)} className="space-y-4">
                <FormField
                  control={externalForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Design Magazine Article" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={externalForm.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Month</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MMMM")
                                ) : (
                                  <span>Pick a month</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={externalForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2023" 
                            {...field} 
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={externalForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="2 weeks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={externalForm.control}
                    name="field"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field *</FormLabel>
                        <FormControl>
                          <Input placeholder="Typography" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={externalForm.control}
                  name="authors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authors</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe, Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={externalForm.control}
                  name="externalLinks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Links *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="https://example.com, https://design-magazine.com/article" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create External Reference</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
