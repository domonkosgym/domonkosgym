import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowLeft, Truck } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  shipping_method: string;
  shipping_country: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_address: string | null;
  box_provider: string | null;
  box_point_label: string | null;
  created_at: string;
}

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { clearCart } = useCart();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
    
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      // We can't fetch order directly due to RLS, but we show success page anyway
      // In production, you'd use a session or email verification
      setOrder({
        id: orderId,
        status: 'NEW',
        total_amount: 0,
        shipping_amount: 0,
        currency: 'HUF',
        customer_name: '',
        customer_email: '',
        shipping_method: 'HOME',
        shipping_country: null,
        shipping_postal_code: null,
        shipping_city: null,
        shipping_address: null,
        box_provider: null,
        box_point_label: null,
        created_at: new Date().toISOString()
      });
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, clearCart]);

  const getLabels = () => {
    const labels: Record<string, Record<string, string>> = {
      hu: {
        title: 'Rendelés sikeres!',
        subtitle: 'Köszönjük a vásárlást!',
        orderNumber: 'Rendelés azonosító',
        status: 'Státusz',
        statusNew: 'Új rendelés',
        statusProcessing: 'Feldolgozás alatt',
        statusShipped: 'Feladva',
        statusCompleted: 'Teljesítve',
        whatNext: 'Mi következik?',
        nextStep1: 'Rendelésedet feldolgozzuk és előkészítjük.',
        nextStep2: 'Értesítünk emailben a szállítás indításáról.',
        nextStep3: 'A csomagodat kézbesítjük a megadott címre.',
        backToHome: 'Vissza a főoldalra',
        orderAgain: 'Új rendelés'
      },
      en: {
        title: 'Order Successful!',
        subtitle: 'Thank you for your purchase!',
        orderNumber: 'Order ID',
        status: 'Status',
        statusNew: 'New Order',
        statusProcessing: 'Processing',
        statusShipped: 'Shipped',
        statusCompleted: 'Completed',
        whatNext: 'What\'s next?',
        nextStep1: 'We will process and prepare your order.',
        nextStep2: 'You will receive an email when shipping begins.',
        nextStep3: 'Your package will be delivered to the provided address.',
        backToHome: 'Back to Home',
        orderAgain: 'Order Again'
      },
      es: {
        title: '¡Pedido Exitoso!',
        subtitle: '¡Gracias por tu compra!',
        orderNumber: 'ID del Pedido',
        status: 'Estado',
        statusNew: 'Nuevo Pedido',
        statusProcessing: 'Procesando',
        statusShipped: 'Enviado',
        statusCompleted: 'Completado',
        whatNext: '¿Qué sigue?',
        nextStep1: 'Procesaremos y prepararemos tu pedido.',
        nextStep2: 'Recibirás un email cuando comience el envío.',
        nextStep3: 'Tu paquete será entregado en la dirección proporcionada.',
        backToHome: 'Volver al Inicio',
        orderAgain: 'Ordenar de Nuevo'
      }
    };
    return labels[language] || labels.hu;
  };

  const labels = getLabels();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-lg w-full">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          {labels.title}
        </h1>
        <p className="text-muted-foreground mb-8">
          {labels.subtitle}
        </p>

        {/* Order Info Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{labels.orderNumber}</p>
              <p className="font-mono font-bold text-foreground">{orderId?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm font-medium">{labels.statusNew}</span>
          </div>

          {/* What's Next */}
          <div>
            <h3 className="font-bold text-foreground mb-4">{labels.whatNext}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">{labels.nextStep1}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">{labels.nextStep2}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Truck className="w-3 h-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{labels.nextStep3}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {labels.backToHome}
          </Button>
          <Button onClick={() => navigate('/tudastar')} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {labels.orderAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}
