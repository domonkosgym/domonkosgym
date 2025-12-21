import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package, 
  Eye, 
  Download, 
  RefreshCw, 
  Truck, 
  CheckCircle,
  Clock,
  XCircle,
  BookOpen,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

type OrderStatus = 'NEW' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
type ShippingMethod = 'HOME' | 'BOX' | 'NONE';

interface Order {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  shipping_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_method: ShippingMethod;
  shipping_country: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_address: string | null;
  box_provider: string | null;
  box_point_id: string | null;
  box_point_label: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  item_type: 'DIGITAL' | 'PHYSICAL';
  products?: {
    title_hu: string;
    cover_image_url: string | null;
  };
}

interface Entitlement {
  id: string;
  token: string;
  expires_at: string;
  download_count: number;
  max_downloads: number;
}

const statusColors: Record<OrderStatus, string> = {
  NEW: 'bg-blue-500/20 text-blue-400',
  PROCESSING: 'bg-yellow-500/20 text-yellow-400',
  SHIPPED: 'bg-purple-500/20 text-purple-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

const statusLabels: Record<OrderStatus, string> = {
  NEW: 'Új',
  PROCESSING: 'Feldolgozás',
  SHIPPED: 'Feladva',
  COMPLETED: 'Teljesítve',
  CANCELLED: 'Törölve',
};

const paymentColors: Record<PaymentStatus, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  PAID: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
  REFUNDED: 'bg-gray-500/20 text-gray-400',
};

const paymentLabels: Record<PaymentStatus, string> = {
  PENDING: 'Függőben',
  PAID: 'Fizetve',
  FAILED: 'Sikertelen',
  REFUNDED: 'Visszatérítve',
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Hiba a rendelések betöltésekor');
      console.error(error);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const fetchOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    
    // Fetch order items with product info
    const { data: items } = await supabase
      .from('order_items')
      .select(`
        *,
        products (
          title_hu,
          cover_image_url
        )
      `)
      .eq('order_id', order.id);

    if (items) {
      setOrderItems(items as any);
    }

    // Fetch entitlements for digital products
    const { data: ents } = await supabase
      .from('digital_entitlements')
      .select('*')
      .eq('order_id', order.id);

    if (ents) {
      setEntitlements(ents as Entitlement[]);
    }

    setDetailDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Hiba történt a státusz frissítésekor');
    } else {
      toast.success('Státusz frissítve');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const regenerateEntitlementToken = async (entitlementId: string) => {
    // Generate new token and reset
    const newToken = crypto.randomUUID().replace(/-/g, '');
    const newExpiry = new Date();
    newExpiry.setHours(newExpiry.getHours() + 72);

    const { error } = await supabase
      .from('digital_entitlements')
      .update({
        token: newToken,
        expires_at: newExpiry.toISOString(),
        download_count: 0,
      })
      .eq('id', entitlementId);

    if (error) {
      toast.error('Hiba történt a token újrageneráláskor');
    } else {
      toast.success('Token újragenerálva');
      if (selectedOrder) {
        fetchOrderDetails(selectedOrder);
      }
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const exportCSV = () => {
    const physicalOrders = orders.filter(o => o.shipping_method !== 'NONE');
    
    const headers = ['Rendelés ID', 'Név', 'Email', 'Telefon', 'Összeg', 'Státusz', 'Szállítási mód', 'Cím', 'Dátum'];
    const rows = physicalOrders.map(o => [
      o.id.slice(0, 8),
      o.customer_name,
      o.customer_email,
      o.customer_phone || '',
      `${o.total_amount} ${o.currency}`,
      statusLabels[o.status],
      o.shipping_method === 'HOME' ? 'Házhozszállítás' : 'Csomagpont',
      o.shipping_method === 'HOME' 
        ? `${o.shipping_postal_code} ${o.shipping_city}, ${o.shipping_address}`
        : o.box_point_label || '',
      format(new Date(o.created_at), 'yyyy.MM.dd HH:mm'),
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const filteredOrders = orders.filter(o => 
    statusFilter === 'all' ? true : o.status === statusFilter
  );

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'NEW').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Rendelések</h1>
          <p className="text-gray-400">Webshop rendelések kezelése</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-gray-400 text-sm">Összes</div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-400">{stats.new}</div>
            <div className="text-gray-400 text-sm">Új</div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.processing}</div>
            <div className="text-gray-400 text-sm">Feldolgozás</div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-400">{stats.shipped}</div>
            <div className="text-gray-400 text-sm">Feladva</div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-gray-400 text-sm">Teljesítve</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'NEW', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'Mind' : statusLabels[status]}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(var(--admin-border))]">
                <TableHead className="text-gray-400">Rendelés</TableHead>
                <TableHead className="text-gray-400">Ügyfél</TableHead>
                <TableHead className="text-gray-400">Összeg</TableHead>
                <TableHead className="text-gray-400">Szállítás</TableHead>
                <TableHead className="text-gray-400">Státusz</TableHead>
                <TableHead className="text-gray-400">Fizetés</TableHead>
                <TableHead className="text-gray-400">Dátum</TableHead>
                <TableHead className="text-gray-400 text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    Nincsenek rendelések
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-[hsl(var(--admin-border))]">
                    <TableCell>
                      <span className="font-mono text-white">#{order.id.slice(0, 8)}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white">{order.customer_name}</p>
                        <p className="text-gray-400 text-xs">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white font-medium">
                        {formatPrice(order.total_amount, order.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.shipping_method === 'NONE' ? (
                        <Badge variant="secondary">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Digitális
                        </Badge>
                      ) : order.shipping_method === 'HOME' ? (
                        <Badge variant="outline">
                          <Truck className="w-3 h-3 mr-1" />
                          Házhozszállítás
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Package className="w-3 h-3 mr-1" />
                          Csomagpont
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentColors[order.payment_status]}>
                        {paymentLabels[order.payment_status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-400 text-sm">
                        {format(new Date(order.created_at), 'MM.dd. HH:mm')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchOrderDetails(order)}
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Rendelés #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400">Státusz:</span>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value: OrderStatus) => updateOrderStatus(selectedOrder.id, value)}
                >
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Ügyfél adatok</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Név:</span>
                    <span className="text-white">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{selectedOrder.customer_email}</span>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Telefon:</span>
                      <span className="text-white">{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Info (if physical) */}
              {selectedOrder.shipping_method !== 'NONE' && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Szállítási adatok</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mód:</span>
                      <span className="text-white">
                        {selectedOrder.shipping_method === 'HOME' ? 'Házhozszállítás' : 'Csomagpont'}
                      </span>
                    </div>
                    {selectedOrder.shipping_method === 'HOME' ? (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cím:</span>
                        <span className="text-white text-right">
                          {selectedOrder.shipping_postal_code} {selectedOrder.shipping_city}<br/>
                          {selectedOrder.shipping_address}<br/>
                          {selectedOrder.shipping_country}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Csomagpont:</span>
                        <span className="text-white">{selectedOrder.box_point_label}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Tételek</h3>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.products?.cover_image_url ? (
                          <img
                            src={item.products.cover_image_url}
                            className="w-8 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-gray-700 rounded flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-white text-sm">{item.products?.title_hu}</p>
                          <p className="text-gray-400 text-xs">
                            {item.quantity}x {formatPrice(item.unit_price, selectedOrder.currency)}
                          </p>
                        </div>
                      </div>
                      <span className="text-white font-medium">
                        {formatPrice(item.line_total, selectedOrder.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 mt-4 pt-4">
                  {selectedOrder.shipping_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Szállítás:</span>
                      <span className="text-white">{formatPrice(selectedOrder.shipping_amount, selectedOrder.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-2">
                    <span className="text-gray-400">Összesen:</span>
                    <span className="text-white">{formatPrice(selectedOrder.total_amount, selectedOrder.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Digital Entitlements */}
              {entitlements.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Letöltési jogosultságok</h3>
                  <div className="space-y-3">
                    {entitlements.map((ent) => (
                      <div key={ent.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded">
                        <div>
                          <p className="text-white font-mono text-xs">{ent.token.slice(0, 16)}...</p>
                          <p className="text-gray-400 text-xs">
                            Lejárat: {format(new Date(ent.expires_at), 'yyyy.MM.dd HH:mm')}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Letöltések: {ent.download_count} / {ent.max_downloads}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateEntitlementToken(ent.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Újragenerálás
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}