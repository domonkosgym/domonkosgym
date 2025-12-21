import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { singleEmailSchema, type SingleEmailFormData } from "@/lib/emailValidation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Upload } from "lucide-react";

export function SingleEmailTab() {
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['email_messages', selectedContactId],
    queryFn: async () => {
      if (!selectedContactId) return [];
      const { data, error } = await supabase
        .from('email_messages')
        .select('*')
        .eq('contact_id', selectedContactId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContactId,
  });

  const form = useForm<SingleEmailFormData>({
    resolver: zodResolver(singleEmailSchema),
    defaultValues: {
      contactId: "",
      subject: "",
      bodyText: "",
      attachmentIds: [],
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: SingleEmailFormData) => {
      const { data: result, error } = await supabase.functions.invoke('send-single-email', {
        body: data,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_messages'] });
      toast.success('Email sikeresen elküldve');
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Hiba: ${error.message}`);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // TODO: Implement file upload logic
      toast.info('Fájl feltöltés fejlesztés alatt');
    } catch (error: any) {
      toast.error(`Hiba a fájl feltöltése során: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: SingleEmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Új üzenet küldése</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Címzett *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedContactId(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Válasszon kontaktot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts?.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name || contact.email} ({contact.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tárgy *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üzenet *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={12}
                          placeholder="Az üzenet tartalma..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Melléklet</FormLabel>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById('single-file-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? 'Feltöltés...' : 'Fájl feltöltése'}
                    </Button>
                    <input
                      id="single-file-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendEmailMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendEmailMutation.isPending ? 'Küldés...' : 'Email küldése'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Beszélgetés előzmények</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedContactId ? (
              <p className="text-muted-foreground text-center py-8">
                Válasszon ki egy kontaktot az előzmények megtekintéséhez
              </p>
            ) : messages?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nincs még üzenet ezzel a kontakttal
              </p>
            ) : (
              <div className="space-y-4">
                {messages?.map((message) => (
                  <Card key={message.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{message.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(message.created_at).toLocaleString('hu-HU')}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            message.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : message.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {message.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {message.body_text.substring(0, 200)}
                        {message.body_text.length > 200 ? '...' : ''}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}