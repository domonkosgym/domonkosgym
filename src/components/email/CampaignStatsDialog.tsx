import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface CampaignStatsDialogProps {
  campaign: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignStatsDialog({ campaign, open, onOpenChange }: CampaignStatsDialogProps) {
  const { data: recipients, isLoading } = useQuery({
    queryKey: ['campaign_recipients', campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const { data, error } = await supabase
        .from('email_campaign_recipients')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!campaign?.id && open,
  });

  const stats = {
    total: recipients?.length || 0,
    sent: recipients?.filter((r) => r.status === 'sent').length || 0,
    failed: recipients?.filter((r) => r.status === 'failed').length || 0,
    pending: recipients?.filter((r) => r.status === 'pending').length || 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "default",
      failed: "destructive",
      pending: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kampány statisztikák - {campaign?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Összes</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <p className="text-sm text-muted-foreground">Sikeresen elküldve</p>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            </div>
            <div className="p-4 border rounded-lg bg-red-50">
              <p className="text-sm text-muted-foreground">Sikertelen</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50">
              <p className="text-sm text-muted-foreground">Függőben</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>

          {/* Recipient Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Címzettek részletei</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Státusz</TableHead>
                    <TableHead>Elküldve</TableHead>
                    <TableHead>Hiba</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Betöltés...
                      </TableCell>
                    </TableRow>
                  ) : recipients?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nincs címzett adat
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipients?.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell className="font-medium">{recipient.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(recipient.status)}
                            {getStatusBadge(recipient.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {recipient.sent_at
                            ? new Date(recipient.sent_at).toLocaleString('hu-HU')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-red-600">
                          {recipient.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
