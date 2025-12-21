import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, CreditCard, AlertCircle } from "lucide-react";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Service {
  id: string;
  name: string;
  price: number;
  slug: string;
  description: string;
}

const DEPOSIT_AMOUNT = 5000;

export default function Checkout() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    depositPaid: number;
    remainingAmount: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    billingAddress: "",
  });

  // Check for payment success callback
  useEffect(() => {
    const paymentSuccess = searchParams.get("payment_success");
    const sessionId = searchParams.get("session_id");
    const paymentCancelled = searchParams.get("payment_cancelled");

    if (paymentCancelled) {
      toast.error("A fizetés megszakítva. Kérjük próbáld újra!");
      // Clean URL
      navigate(`/checkout/${slug}`, { replace: true });
      return;
    }

    if (paymentSuccess && sessionId) {
      verifyPaymentAndCreateBooking(sessionId);
    }
  }, [searchParams, slug]);

  const verifyPaymentAndCreateBooking = async (sessionId: string) => {
    setVerifyingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-deposit-payment", {
        body: { sessionId },
      });

      if (error) throw error;

      if (data.success) {
        setBookingResult({
          depositPaid: data.depositPaid,
          remainingAmount: data.remainingAmount,
        });
        setShowSuccessDialog(true);
        // Clean URL
        navigate(`/checkout/${slug}`, { replace: true });
      } else {
        toast.error(data.error || "Hiba történt a fizetés ellenőrzése során");
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      toast.error("Hiba történt a fizetés ellenőrzése során");
    } finally {
      setVerifyingPayment(false);
    }
  };

  useEffect(() => {
    const fetchService = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching service:', error);
        toast.error('Szolgáltatás nem található');
        navigate('/services');
        return;
      }

      if (!data) {
        toast.error('Szolgáltatás nem található');
        navigate('/services');
        return;
      }

      setService(data);
    };

    if (slug) {
      fetchService();
    }
  }, [slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Kérlek válassz időpontot!');
      return;
    }

    if (!service) {
      toast.error('Szolgáltatás nem található');
      return;
    }

    setLoading(true);

    try {
      // For free services, create booking directly
      if (service.price === 0) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert({
            service_id: service.id,
            customer_name: formData.customerName,
            customer_email: formData.customerEmail,
            customer_phone: formData.customerPhone,
            billing_address: formData.billingAddress,
            scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
            scheduled_time: selectedTime,
            duration_minutes: 30,
            price: 0,
            status: 'pending',
            paid: true,
          });

        if (bookingError) throw bookingError;

        setBookingResult({ depositPaid: 0, remainingAmount: 0 });
        setShowSuccessDialog(true);
        return;
      }

      // For paid services, redirect to Stripe payment
      const { data, error } = await supabase.functions.invoke("create-deposit-payment", {
        body: {
          customerEmail: formData.customerEmail,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          billingAddress: formData.billingAddress,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
          scheduledTime: selectedTime,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Hiba történt a foglalás során");
    } finally {
      setLoading(false);
    }
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  if (verifyingPayment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Fizetés ellenőrzése...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const requiresDeposit = service.price > 0;
  const remainingAfterDeposit = service.price - DEPOSIT_AMOUNT;

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-6 -ml-2 text-xs sm:text-sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Vissza a főoldalra
        </Button>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground uppercase mb-1 sm:mb-2">
          {t('checkout.title')}
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-1 sm:mb-2">
          {service.name}
        </p>
        <p className="text-lg sm:text-xl font-bold text-primary mb-6 sm:mb-8">
          {service.price === 0 ? 'Ingyenes' : `${service.price.toLocaleString()} Ft`}
        </p>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Időpont választó */}
          <div>
            <DateTimePicker
              serviceId={service.id}
              serviceDuration={30}
              onSelect={handleDateTimeSelect}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </div>

          {/* Ügyfél adatok */}
          <div className="space-y-3 sm:space-y-4">
            {/* Deposit Info Alert */}
            {requiresDeposit && (
              <Alert className="border-primary/50 bg-primary/10">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <AlertTitle className="text-primary font-bold text-sm sm:text-base">
                  Előleg fizetése szükséges
                </AlertTitle>
                <AlertDescription className="text-foreground/80 space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm">
                    A foglalás véglegesítéséhez <span className="font-bold">{DEPOSIT_AMOUNT.toLocaleString()} Ft</span> előleg fizetése szükséges bankkártyával.
                  </p>
                  <p className="text-[10px] sm:text-sm">
                    Az előleg összege levonásra kerül a szolgáltatás teljes árából.
                    {remainingAfterDeposit > 0 && (
                      <> A fennmaradó <span className="font-semibold">{remainingAfterDeposit.toLocaleString()} Ft</span> a helyszínen fizetendő.</>
                    )}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Card className="p-4 sm:p-6 bg-card border-border">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium">Név *</label>
                  <Input
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Teljes név"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium">Email *</label>
                  <Input
                    required
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="pelda@email.hu"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium">Telefonszám</label>
                  <Input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+36 30 123 4567"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium">Számlázási cím</label>
                  <Textarea
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="Cím, irányítószám, város"
                    className="mt-1 text-sm"
                    rows={3}
                  />
                </div>

                {selectedDate && selectedTime && (
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium mb-1">Kiválasztott időpont:</p>
                    <p className="text-base sm:text-lg font-bold">
                      {format(selectedDate, 'yyyy. MMMM dd.', { locale: hu })} - {selectedTime}
                    </p>
                  </div>
                )}

                {/* Payment Summary */}
                {requiresDeposit && selectedDate && selectedTime && (
                  <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium">Fizetés összesítő:</p>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Szolgáltatás ára:</span>
                      <span>{service.price.toLocaleString()} Ft</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-primary">
                      <span>Most fizetendő előleg:</span>
                      <span>{DEPOSIT_AMOUNT.toLocaleString()} Ft</span>
                    </div>
                    {remainingAfterDeposit > 0 && (
                      <div className="flex justify-between text-[10px] sm:text-sm text-muted-foreground">
                        <span>Helyszínen fizetendő:</span>
                        <span>{remainingAfterDeposit.toLocaleString()} Ft</span>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading || !selectedDate || !selectedTime} 
                  className="w-full text-xs sm:text-sm md:text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      Feldolgozás...
                    </>
                  ) : requiresDeposit ? (
                    <>
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Előleg fizetése ({DEPOSIT_AMOUNT.toLocaleString()} Ft)
                    </>
                  ) : (
                    "Időpont foglalása"
                  )}
                </Button>

                {requiresDeposit && (
                  <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                    A gombra kattintva átirányítunk a biztonságos Stripe fizetési oldalra.
                  </p>
                )}
              </form>
            </Card>
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="rounded-full bg-green-100 p-2 sm:p-3">
                  <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl sm:text-2xl">
                Gratulálunk!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <p className="text-center text-base sm:text-lg font-semibold text-green-600">
                Az időpont foglalás sikeres!
              </p>
              
              <div className="bg-muted rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="border-b border-border pb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">Szolgáltatás</p>
                  <p className="font-semibold text-sm sm:text-base">{service?.name}</p>
                </div>
                
                <div className="border-b border-border pb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">Név</p>
                  <p className="font-semibold text-sm sm:text-base">{formData.customerName}</p>
                </div>
                
                <div className="border-b border-border pb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold text-sm sm:text-base">{formData.customerEmail}</p>
                </div>
                
                {selectedDate && selectedTime && (
                  <div className="border-b border-border pb-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Időpont</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {format(selectedDate, 'yyyy. MMMM dd.', { locale: hu })} - {selectedTime}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Fizetés státusz</p>
                  {bookingResult?.depositPaid && bookingResult.depositPaid > 0 ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-sm sm:text-base text-green-600">
                        ✓ Előleg fizetve: {bookingResult.depositPaid.toLocaleString()} Ft
                      </p>
                      {bookingResult.remainingAmount > 0 && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Fennmaradó összeg (helyszínen): {bookingResult.remainingAmount.toLocaleString()} Ft
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-semibold text-sm sm:text-base text-green-600">Ingyenes szolgáltatás</p>
                  )}
                </div>
              </div>

              <p className="text-center text-xs sm:text-sm text-muted-foreground">
                Hamarosan értesítést kapsz emailben a foglalás megerősítéséről.
              </p>
              
              <Button 
                onClick={() => navigate('/')} 
                className="w-full mt-3 sm:mt-4 text-sm sm:text-base"
                size="lg"
              >
                Vissza a főoldalra
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
