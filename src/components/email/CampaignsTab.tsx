import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Send, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CampaignDialog } from "./CampaignDialog";
import { CampaignStatsDialog } from "./CampaignStatsDialog";

export function CampaignsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [sendingCampaign, setSendingCampaign] = useState<any>(null);
  const [statsDialogCampaign, setStatsDialogCampaign] = useState<any>(null);
  const [recipientCount, setRecipientCount] = useState(0);
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['email_campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          recipients:email_campaign_recipients(count)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribedCount } = useQuery({
    queryKey: ['subscribed_contacts_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('is_subscribed', true);
      if (error) throw error;
      return count || 0;
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: { campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign_recipients'] });
      toast.success(`Kampány elküldve: ${data.stats.sent} sikeres, ${data.stats.failed} sikertelen`);
      setSendingCampaign(null);
    },
    onError: (error: any) => {
      toast.error(`Hiba a küldés során: ${error.message}`);
    },
  });

  const resendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // Reset campaign status to draft for resending
      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({ status: 'draft' })
        .eq('id', campaignId);
      
      if (updateError) throw updateError;

      // Delete existing recipients so they can be recreated
      const { error: deleteError } = await supabase
        .from('email_campaign_recipients')
        .delete()
        .eq('campaign_id', campaignId);
      
      if (deleteError) throw deleteError;

      return { campaignId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign_recipients'] });
      toast.success('Kampány újraküldésre előkészítve');
    },
    onError: (error: any) => {
      toast.error(`Hiba: ${error.message}`);
    },
  });

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setIsDialogOpen(true);
  };

  const handleNewCampaign = () => {
    setEditingCampaign(null);
    setIsDialogOpen(true);
  };

  const handleSend = (campaign: any) => {
    setRecipientCount(subscribedCount || 0);
    setSendingCampaign(campaign);
  };

  const handleResend = (campaign: any) => {
    if (confirm('Biztosan újra szeretné küldeni ezt a kampányt? Az eddigi státuszok törlődnek.')) {
      resendCampaignMutation.mutate(campaign.id);
    }
  };

  const handleViewStats = (campaign: any) => {
    setStatsDialogCampaign(campaign);
  };

  const confirmSend = () => {
    if (sendingCampaign) {
      sendCampaignMutation.mutate(sendingCampaign.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      scheduled: "outline",
      sending: "default",
      sent: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {subscribedCount || 0} feliratkozott kontakt
          </p>
        </div>
        <Button onClick={handleNewCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          Új kampány
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Név</TableHead>
              <TableHead>Tárgy</TableHead>
              <TableHead>Státusz</TableHead>
              <TableHead>Címzettek</TableHead>
              <TableHead>Létrehozva</TableHead>
              <TableHead className="text-right">Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Betöltés...
                </TableCell>
              </TableRow>
            ) : campaigns?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nincs kampány még
                </TableCell>
              </TableRow>
            ) : (
              campaigns?.map((campaign) => {
                const recipientCount = campaign.recipients?.[0]?.count || 0;
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.subject}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      {recipientCount > 0 ? `${recipientCount} címzett` : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.created_at).toLocaleDateString('hu-HU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {campaign.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(campaign)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSend(campaign)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Küldés
                            </Button>
                          </>
                        )}
                        {campaign.status === 'sent' && recipientCount > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStats(campaign)}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Statisztika
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleResend(campaign)}
                              disabled={resendCampaignMutation.isPending}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Újraküldés
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CampaignDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        campaign={editingCampaign}
      />

      <CampaignStatsDialog
        campaign={statsDialogCampaign}
        open={!!statsDialogCampaign}
        onOpenChange={(open) => !open && setStatsDialogCampaign(null)}
      />

      <AlertDialog open={!!sendingCampaign} onOpenChange={() => setSendingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kampány elküldése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan elküldi a "{sendingCampaign?.name}" kampányt {recipientCount}{" "}
              feliratkozottnak?
              
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 font-semibold">⚠️ Fontos:</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Resend ingyenes verzióval csak a saját email címedre küldhetsz emailt. 
                  Éles használathoz validálj egy domain-t a resend.com/domains címen.
                </p>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold">{sendingCampaign?.subject}</p>
                <p className="mt-2 text-sm whitespace-pre-wrap">
                  {sendingCampaign?.body_text?.substring(0, 200)}
                  {sendingCampaign?.body_text?.length > 200 ? '...' : ''}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSend}
              disabled={sendCampaignMutation.isPending}
            >
              {sendCampaignMutation.isPending ? 'Küldés...' : 'Küldés most'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}