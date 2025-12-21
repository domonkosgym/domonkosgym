import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContactDialog } from "./ContactDialog";

export function ContactsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', searchQuery, showSubscribedOnly],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      if (showSubscribedOnly) {
        query = query.eq('is_subscribed', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Kontakt törölve');
    },
    onError: (error: any) => {
      toast.error(`Hiba: ${error.message}`);
    },
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: async ({ id, isSubscribed }: { id: string; isSubscribed: boolean }) => {
      const { error } = await supabase
        .from('contacts')
        .update({
          is_subscribed: !isSubscribed,
          unsubscribed_at: !isSubscribed ? null : new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Feliratkozás állapot frissítve');
    },
    onError: (error: any) => {
      toast.error(`Hiba: ${error.message}`);
    },
  });

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const handleNewContact = () => {
    setEditingContact(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Keresés név vagy email alapján..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={showSubscribedOnly}
              onCheckedChange={setShowSubscribedOnly}
            />
            <span className="text-sm">Csak feliratkozottak</span>
          </div>
        </div>
        <Button onClick={handleNewContact}>
          <Plus className="mr-2 h-4 w-4" />
          Új kontakt
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Név</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Címkék</TableHead>
              <TableHead>Ország</TableHead>
              <TableHead>Feliratkozott</TableHead>
              <TableHead>Létrehozva</TableHead>
              <TableHead className="text-right">Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Betöltés...
                </TableCell>
              </TableRow>
            ) : contacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nincs megjeleníthető kontakt
                </TableCell>
              </TableRow>
            ) : (
              contacts?.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{contact.name || '-'}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags && contact.tags.length > 0 ? (
                        contact.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{contact.country || '-'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={contact.is_subscribed}
                      onCheckedChange={() =>
                        toggleSubscriptionMutation.mutate({
                          id: contact.id,
                          isSubscribed: contact.is_subscribed,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(contact.created_at).toLocaleDateString('hu-HU')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ContactDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contact={editingContact}
      />
    </div>
  );
}