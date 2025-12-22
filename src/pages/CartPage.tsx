import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Package, Download } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CartIcon } from "@/components/CartIcon";

interface ShippingProvider {
  id: string;
  name: string;
  provider_type: string;
  fee: number;
}

interface ShippingConfig {
  base_fee: number;
  box_fee: number;
  free_shipping_threshold: number | null;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, getSubtotal, hasPhysicalItems } = useCart();
  const { language, t } = useLanguage();
  
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [shippingProviders, setShippingProviders] = useState<ShippingProvider[]>([]);
  const [shippingMethod, setShippingMethod] = useState<'HOME' | 'BOX' | 'NONE'>('HOME');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  
  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Shipping address
  const [shippingCountry, setShippingCountry] = useState('Magyarország');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [boxProvider, setBoxProvider] = useState('');
  const [boxPointId, setBoxPointId] = useState('');
  const [boxPointLabel, setBoxPointLabel] = useState('');
  
  // Billing address
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingName, setBillingName] = useState('');
  const [billingCountry, setBillingCountry] = useState('Magyarország');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchShippingData = async () => {
      const [configRes, providersRes] = await Promise.all([
        supabase.from('shipping_config').select('*').limit(1).maybeSingle(),
        supabase.from('shipping_providers').select('*').eq('is_active', true).order('sort_order')
      ]);
      
      if (configRes.data) {
        setShippingConfig(configRes.data as ShippingConfig);
      }
      if (providersRes.data) {
        setShippingProviders(providersRes.data);
        // Set first home provider as default
        const homeProviders = providersRes.data.filter(p => p.provider_type === 'HOME');
        if (homeProviders.length > 0) {
          setSelectedProviderId(homeProviders[0].id);
        }
      }
    };
    
    if (hasPhysicalItems()) {
      fetchShippingData();
    }
  }, []);
  
  const homeProviders = shippingProviders.filter(p => p.provider_type === 'HOME');
  const boxProviders = shippingProviders.filter(p => p.provider_type === 'BOX');
  
  const getShippingFee = () => {
    if (!hasPhysicalItems()) return 0;
    
    const subtotal = getSubtotal();
    if (shippingConfig?.free_shipping_threshold && subtotal >= shippingConfig.free_shipping_threshold) {
      return 0;
    }
    
    const selectedProvider = shippingProviders.find(p => p.id === selectedProviderId);
    return selectedProvider?.fee || 0;
  };
  
  const getTotal = () => {
    return getSubtotal() + getShippingFee();
  };
  
  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('hu-HU')} Ft`;
  };
  
  const getSelectedProviderName = () => {
    const provider = shippingProviders.find(p => p.id === selectedProviderId);
    return provider?.name || '';
  };

  const handleSubmit = async () => {
    // Validation
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Kérlek add meg a neved és email címed!');
      return;
    }
    
    if (hasPhysicalItems() && shippingMethod === 'HOME') {
      if (!shippingPostalCode.trim() || !shippingCity.trim() || !shippingAddress.trim()) {
        toast.error('Kérlek add meg a szállítási címet!');
        return;
      }
    }
    
    if (hasPhysicalItems() && shippingMethod === 'BOX') {
      if (!boxProvider.trim() || !boxPointId.trim()) {
        toast.error('Kérlek add meg a csomagpont adatait!');
        return;
      }
    }
    
    if (!billingSameAsShipping) {
      if (!billingPostalCode.trim() || !billingCity.trim() || !billingAddress.trim()) {
        toast.error('Kérlek add meg a számlázási címet!');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const total = getTotal();
      const shippingAmount = getShippingFee();
      const providerName = getSelectedProviderName();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          total_amount: total,
          shipping_amount: shippingAmount,
          shipping_method: hasPhysicalItems() ? shippingMethod : 'NONE',
          shipping_country: hasPhysicalItems() && shippingMethod === 'HOME' ? shippingCountry : null,
          shipping_postal_code: hasPhysicalItems() && shippingMethod === 'HOME' ? shippingPostalCode : null,
          shipping_city: hasPhysicalItems() && shippingMethod === 'HOME' ? shippingCity : null,
          shipping_address: hasPhysicalItems() && shippingMethod === 'HOME' ? shippingAddress : null,
          box_provider: shippingMethod === 'BOX' ? boxProvider : (shippingMethod === 'HOME' ? providerName : null),
          box_point_id: shippingMethod === 'BOX' ? boxPointId : null,
          box_point_label: shippingMethod === 'BOX' ? boxPointLabel : null,
          billing_same_as_shipping: billingSameAsShipping,
          billing_name: billingSameAsShipping ? customerName : billingName,
          billing_country: billingSameAsShipping ? (hasPhysicalItems() ? shippingCountry : 'Magyarország') : billingCountry,
          billing_postal_code: billingSameAsShipping ? shippingPostalCode : billingPostalCode,
          billing_city: billingSameAsShipping ? shippingCity : billingCity,
          billing_address: billingSameAsShipping ? shippingAddress : billingAddress,
          status: 'NEW',
          payment_status: 'PENDING'
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.salePrice ?? item.price,
        line_total: (item.salePrice ?? item.price) * item.quantity,
        item_type: item.productType
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // If total > 0, redirect to Stripe
      if (total > 0) {
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-cart-checkout', {
          body: {
            orderId: order.id,
            items: items.map(item => ({
              id: item.id,
              title: item.title,
              price: item.salePrice ?? item.price,
              quantity: item.quantity
            })),
            shippingFee: shippingAmount,
            customerEmail
          }
        });
        
        if (checkoutError) throw checkoutError;
        
        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
        }
      } else {
        // Free order - mark as completed
        await supabase
          .from('orders')
          .update({ status: 'COMPLETED', payment_status: 'PAID' })
          .eq('id', order.id);
        
        clearCart();
        navigate(`/order-success/${order.id}`);
      }
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error('Hiba történt a rendelés leadásakor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="flex justify-between items-center px-4 md:px-12 py-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Vissza
          </Button>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <CartIcon />
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">A kosár üres</h1>
          <p className="text-muted-foreground mb-6">Nézd meg a kínálatunkat és válaszd ki a neked tetsző termékeket!</p>
          <Button onClick={() => navigate('/#books')}>
            Termékek megtekintése
          </Button>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex justify-between items-center px-4 md:px-12 py-4">
        <Button variant="ghost" onClick={() => navigate('/#books')} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Vissza a könyvekhez
        </Button>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <CartIcon />
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Kosár</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  {item.coverImageUrl ? (
                    <img 
                      src={item.coverImageUrl} 
                      alt={item.title}
                      className="w-20 h-28 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-muted rounded flex items-center justify-center">
                      {item.productType === 'DIGITAL' ? (
                        <Download className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.productType === 'DIGITAL' ? 'Digitális' : 'Fizikai'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        {item.salePrice ? (
                          <>
                            <span className="text-sm line-through text-muted-foreground mr-2">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            <span className="font-bold text-primary">
                              {formatPrice(item.salePrice * item.quantity)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <Button variant="outline" onClick={clearCart} className="w-full">
              Kosár ürítése
            </Button>
          </div>
          
          {/* Order Summary & Form */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card className="p-6">
              <h2 className="font-bold mb-4">Vásárló adatai</h2>
              <div className="space-y-4">
                <div>
                  <Label>Név *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Teljes név"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>Telefonszám</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+36 30 123 4567"
                  />
                </div>
              </div>
            </Card>
            
            {/* Shipping (only for physical items) */}
            {hasPhysicalItems() && (
              <Card className="p-6">
                <h2 className="font-bold mb-4">Szállítás</h2>
                <RadioGroup value={shippingMethod} onValueChange={(v) => {
                  setShippingMethod(v as 'HOME' | 'BOX');
                  // Set first provider of new type
                  const providers = v === 'HOME' ? homeProviders : boxProviders;
                  if (providers.length > 0) {
                    setSelectedProviderId(providers[0].id);
                  }
                }}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HOME" id="home" />
                    <Label htmlFor="home">Házhozszállítás</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BOX" id="box" />
                    <Label htmlFor="box">Csomagpont</Label>
                  </div>
                </RadioGroup>
                
                {shippingMethod === 'HOME' && (
                  <div className="space-y-4 mt-4">
                    {/* Provider Selection */}
                    {homeProviders.length > 0 && (
                      <div>
                        <Label>Szállító szolgáltató *</Label>
                        <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz szolgáltatót" />
                          </SelectTrigger>
                          <SelectContent>
                            {homeProviders.map(provider => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name} - {formatPrice(provider.fee)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Ország</Label>
                      <Input value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Irányítószám *</Label>
                        <Input value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} />
                      </div>
                      <div>
                        <Label>Város *</Label>
                        <Input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Cím *</Label>
                      <Input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Utca, házszám" />
                    </div>
                  </div>
                )}
                
                {shippingMethod === 'BOX' && (
                  <div className="space-y-4 mt-4">
                    {/* Box Provider Selection */}
                    {boxProviders.length > 0 ? (
                      <div>
                        <Label>Csomagpont szolgáltató *</Label>
                        <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz szolgáltatót" />
                          </SelectTrigger>
                          <SelectContent>
                            {boxProviders.map(provider => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name} - {formatPrice(provider.fee)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <Label>Szolgáltató *</Label>
                        <Input value={boxProvider} onChange={(e) => setBoxProvider(e.target.value)} placeholder="pl. Foxpost, GLS" />
                      </div>
                    )}
                    <div>
                      <Label>Csomagpont azonosító *</Label>
                      <Input value={boxPointId} onChange={(e) => setBoxPointId(e.target.value)} placeholder="Csomagpont kód" />
                    </div>
                    <div>
                      <Label>Csomagpont neve/címe</Label>
                      <Input value={boxPointLabel} onChange={(e) => setBoxPointLabel(e.target.value)} placeholder="pl. Budapest, Westend" />
                    </div>
                  </div>
                )}
                
                {shippingConfig?.free_shipping_threshold && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {formatPrice(shippingConfig.free_shipping_threshold)} feletti rendelésnél ingyenes szállítás!
                  </p>
                )}
              </Card>
            )}
            
            {/* Billing */}
            <Card className="p-6">
              <h2 className="font-bold mb-4">Számlázási adatok</h2>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="same-billing"
                  checked={billingSameAsShipping}
                  onCheckedChange={(checked) => setBillingSameAsShipping(!!checked)}
                />
                <Label htmlFor="same-billing">
                  {hasPhysicalItems() ? 'Megegyezik a szállítási címmel' : 'Megegyezik a vásárló adataival'}
                </Label>
              </div>
              
              {!billingSameAsShipping && (
                <div className="space-y-4">
                  <div>
                    <Label>Számlázási név *</Label>
                    <Input value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder="Cégnév vagy teljes név" />
                  </div>
                  <div>
                    <Label>Ország</Label>
                    <Input value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Irányítószám *</Label>
                      <Input value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} />
                    </div>
                    <div>
                      <Label>Város *</Label>
                      <Input value={billingCity} onChange={(e) => setBillingCity(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Cím *</Label>
                    <Input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Utca, házszám" />
                  </div>
                </div>
              )}
            </Card>
            
            {/* Summary */}
            <Card className="p-6">
              <h2 className="font-bold mb-4">Összegzés</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Részösszeg:</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                {hasPhysicalItems() && (
                  <div className="flex justify-between">
                    <span>Szállítás ({getSelectedProviderName()}):</span>
                    <span>{getShippingFee() === 0 ? 'Ingyenes' : formatPrice(getShippingFee())}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Összesen:</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? 'Feldolgozás...' : 'Megrendelés és fizetés'}
              </Button>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
