import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { BookOpen, Package, ShoppingCart, Minus, Plus, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";

interface Product {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  subtitle_hu: string | null;
  subtitle_en: string | null;
  subtitle_es: string | null;
  description_hu: string;
  description_en: string;
  description_es: string;
  excerpt_hu: string | null;
  excerpt_en: string | null;
  excerpt_es: string | null;
  product_type: 'DIGITAL' | 'PHYSICAL';
  price_gross: number;
  currency: string;
  cover_image_url: string | null;
  gallery_images: string[];
  is_featured: boolean;
  is_on_sale: boolean;
  sale_price: number | null;
}

interface ShippingConfig {
  base_fee: number;
  box_fee: number;
  currency: string;
  free_shipping_threshold: number | null;
}

interface ShippingProvider {
  id: string;
  name: string;
  provider_type: string;
  fee: number;
  is_active: boolean;
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [shippingProviders, setShippingProviders] = useState<ShippingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [shippingMethod, setShippingMethod] = useState<'HOME' | 'BOX'>('HOME');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingCountry, setShippingCountry] = useState('Magyarország');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [boxProvider, setBoxProvider] = useState('');
  const [boxPointId, setBoxPointId] = useState('');
  
  // Billing address
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingCountry, setBillingCountry] = useState('Magyarország');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const [productRes, shippingRes, providersRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).maybeSingle(),
        supabase.from('shipping_config').select('*').limit(1).maybeSingle(),
        supabase.from('shipping_providers').select('*').eq('is_active', true).order('sort_order')
      ]);

      if (productRes.data) {
        setProduct(productRes.data as Product);
      }
      if (shippingRes.data) {
        setShippingConfig(shippingRes.data as ShippingConfig);
      }
      if (providersRes.data) {
        setShippingProviders(providersRes.data as ShippingProvider[]);
        // Set default provider
        const homeProviders = providersRes.data.filter(p => p.provider_type === 'HOME');
        if (homeProviders.length > 0) {
          setSelectedProviderId(homeProviders[0].id);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const getTitle = () => {
    if (!product) return '';
    switch (language) {
      case 'en': return product.title_en;
      case 'es': return product.title_es;
      default: return product.title_hu;
    }
  };

  const getSubtitle = () => {
    if (!product) return '';
    switch (language) {
      case 'en': return product.subtitle_en;
      case 'es': return product.subtitle_es;
      default: return product.subtitle_hu;
    }
  };

  const getDescription = () => {
    if (!product) return '';
    switch (language) {
      case 'en': return product.description_en;
      case 'es': return product.description_es;
      default: return product.description_hu;
    }
  };

  const getExcerpt = () => {
    if (!product) return '';
    switch (language) {
      case 'en': return product.excerpt_en;
      case 'es': return product.excerpt_es;
      default: return product.excerpt_hu;
    }
  };

  const formatPrice = (price: number) => {
    if (!product) return '';
    return new Intl.NumberFormat(language === 'hu' ? 'hu-HU' : language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getUnitPrice = () => {
    if (!product) return 0;
    return product.is_on_sale && product.sale_price ? product.sale_price : product.price_gross;
  };

  const getShippingFee = () => {
    if (!product || product.product_type === 'DIGITAL' || !shippingConfig) return 0;
    const subtotal = getUnitPrice() * quantity;
    if (shippingConfig.free_shipping_threshold && subtotal >= shippingConfig.free_shipping_threshold) {
      return 0;
    }
    // Get fee from selected provider
    const selectedProvider = shippingProviders.find(p => p.id === selectedProviderId);
    if (selectedProvider) {
      return selectedProvider.fee;
    }
    // Fallback to config
    return shippingMethod === 'BOX' ? shippingConfig.box_fee : shippingConfig.base_fee;
  };

  const homeProviders = shippingProviders.filter(p => p.provider_type === 'HOME');
  const boxProviders = shippingProviders.filter(p => p.provider_type === 'BOX');

  const getTotalAmount = () => {
    return getUnitPrice() * quantity + getShippingFee();
  };

  const getLabels = () => {
    const labels: Record<string, Record<string, string>> = {
      hu: {
        back: 'Vissza a Tudástárhoz',
        digital: 'E-könyv (online)',
        physical: 'Fizikai könyv (offline)',
        featured: 'Kiemelt',
        sale: 'Akció',
        quantity: 'Mennyiség',
        buyNow: 'Megvásárolom',
        addToCart: 'Kosárba',
        excerptTitle: 'Részletek a könyvből',
        customerInfo: 'Vásárlói adatok',
        name: 'Név',
        email: 'Email',
        phone: 'Telefon (opcionális)',
        shippingInfo: 'Postázási cím',
        billingInfo: 'Számlázási cím',
        billingSameAsShipping: 'Megegyezik a postázási címmel',
        shippingMethod: 'Szállítási mód',
        homeDelivery: 'Házhozszállítás',
        boxDelivery: 'Csomagpontra kérem',
        country: 'Ország',
        postalCode: 'Irányítószám',
        city: 'Város',
        address: 'Utca, házszám',
        boxProvider: 'Szolgáltató',
        boxPointId: 'Automata azonosító/cím',
        subtotal: 'Részösszeg',
        shipping: 'Szállítás',
        freeShipping: 'Ingyenes',
        total: 'Összesen',
        noShipping: 'Digitális terméknél nincs szállítás',
        processing: 'Feldolgozás...',
        successTitle: 'Sikeres rendelés!',
        successDigital: 'A letöltési link hamarosan megérkezik az email címedre.',
        successPhysical: 'A rendelésed feldolgozás alatt. Hamarosan értesítünk a szállításról.',
        errorTitle: 'Hiba történt',
        errorMsg: 'Kérjük próbáld újra később.',
        requiredFields: 'Kérjük töltsd ki az összes kötelező mezőt!'
      },
      en: {
        back: 'Back to Knowledge Base',
        digital: 'E-book (online)',
        physical: 'Physical book (offline)',
        featured: 'Featured',
        sale: 'Sale',
        quantity: 'Quantity',
        buyNow: 'Buy Now',
        addToCart: 'Add to Cart',
        excerptTitle: 'Book Details',
        customerInfo: 'Customer Information',
        name: 'Name',
        email: 'Email',
        phone: 'Phone (optional)',
        shippingInfo: 'Shipping Address',
        billingInfo: 'Billing Address',
        billingSameAsShipping: 'Same as shipping address',
        shippingMethod: 'Shipping Method',
        homeDelivery: 'Home Delivery',
        boxDelivery: 'Parcel Locker',
        country: 'Country',
        postalCode: 'Postal Code',
        city: 'City',
        address: 'Street, House Number',
        boxProvider: 'Provider',
        boxPointId: 'Locker ID/Address',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        freeShipping: 'Free',
        total: 'Total',
        noShipping: 'No shipping for digital products',
        processing: 'Processing...',
        successTitle: 'Order Successful!',
        successDigital: 'Download link will be sent to your email shortly.',
        successPhysical: 'Your order is being processed. We will notify you about shipping.',
        errorTitle: 'Error',
        errorMsg: 'Please try again later.',
        requiredFields: 'Please fill in all required fields!'
      },
      es: {
        back: 'Volver a Base de Conocimiento',
        digital: 'E-libro (en línea)',
        physical: 'Libro físico (offline)',
        featured: 'Destacado',
        sale: 'Oferta',
        quantity: 'Cantidad',
        buyNow: 'Comprar Ahora',
        addToCart: 'Añadir al carrito',
        excerptTitle: 'Detalles del Libro',
        customerInfo: 'Información del Cliente',
        name: 'Nombre',
        email: 'Email',
        phone: 'Teléfono (opcional)',
        shippingInfo: 'Dirección de Envío',
        billingInfo: 'Dirección de Facturación',
        billingSameAsShipping: 'Igual que la dirección de envío',
        shippingMethod: 'Método de Envío',
        homeDelivery: 'Entrega a Domicilio',
        boxDelivery: 'Punto de Recogida',
        country: 'País',
        postalCode: 'Código Postal',
        city: 'Ciudad',
        address: 'Calle, Número',
        boxProvider: 'Proveedor',
        boxPointId: 'ID/Dirección del Punto',
        subtotal: 'Subtotal',
        shipping: 'Envío',
        freeShipping: 'Gratis',
        total: 'Total',
        noShipping: 'Sin envío para productos digitales',
        processing: 'Procesando...',
        successTitle: '¡Pedido Exitoso!',
        successDigital: 'El enlace de descarga se enviará a tu email pronto.',
        successPhysical: 'Tu pedido está siendo procesado. Te notificaremos sobre el envío.',
        errorTitle: 'Error',
        errorMsg: 'Por favor intenta de nuevo más tarde.',
        requiredFields: '¡Por favor completa todos los campos requeridos!'
      }
    };
    return labels[language] || labels.hu;
  };

  const labels = getLabels();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Validation
    if (!customerName || !customerEmail) {
      toast.error(labels.requiredFields);
      return;
    }

    if (product.product_type === 'PHYSICAL') {
      if (shippingMethod === 'HOME') {
        if (!shippingCountry || !shippingPostalCode || !shippingCity || !shippingAddress) {
          toast.error(labels.requiredFields);
          return;
        }
      } else {
        if (!boxProvider || !boxPointId) {
          toast.error(labels.requiredFields);
          return;
        }
      }
      // Validate billing address if different from shipping
      if (!billingSameAsShipping) {
        if (!billingCountry || !billingPostalCode || !billingCity || !billingAddress) {
          toast.error(labels.requiredFields);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Determine billing address values
      const finalBillingCountry = billingSameAsShipping ? shippingCountry : billingCountry;
      const finalBillingPostalCode = billingSameAsShipping ? shippingPostalCode : billingPostalCode;
      const finalBillingCity = billingSameAsShipping ? shippingCity : billingCity;
      const finalBillingAddress = billingSameAsShipping ? shippingAddress : billingAddress;

      // Create order
      const orderData = {
        status: 'NEW' as const,
        payment_status: 'PAID' as const, // Stub - simulated payment
        total_amount: getTotalAmount(),
        shipping_amount: getShippingFee(),
        currency: product.currency,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        shipping_method: product.product_type === 'DIGITAL' ? 'NONE' as const : shippingMethod,
        shipping_country: product.product_type === 'PHYSICAL' && shippingMethod === 'HOME' ? shippingCountry : null,
        shipping_postal_code: product.product_type === 'PHYSICAL' && shippingMethod === 'HOME' ? shippingPostalCode : null,
        shipping_city: product.product_type === 'PHYSICAL' && shippingMethod === 'HOME' ? shippingCity : null,
        shipping_address: product.product_type === 'PHYSICAL' && shippingMethod === 'HOME' ? shippingAddress : null,
        box_provider: product.product_type === 'PHYSICAL' && shippingMethod === 'BOX' ? boxProvider : null,
        box_point_id: product.product_type === 'PHYSICAL' && shippingMethod === 'BOX' ? boxPointId : null,
        box_point_label: product.product_type === 'PHYSICAL' && shippingMethod === 'BOX' ? `${boxProvider} - ${boxPointId}` : null,
        // Billing address
        billing_same_as_shipping: product.product_type === 'PHYSICAL' ? billingSameAsShipping : true,
        billing_country: product.product_type === 'PHYSICAL' ? finalBillingCountry : null,
        billing_postal_code: product.product_type === 'PHYSICAL' ? finalBillingPostalCode : null,
        billing_city: product.product_type === 'PHYSICAL' ? finalBillingCity : null,
        billing_address: product.product_type === 'PHYSICAL' ? finalBillingAddress : null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: quantity,
          unit_price: getUnitPrice(),
          line_total: getUnitPrice() * quantity,
          item_type: product.product_type
        });

      if (itemError) throw itemError;

      // Build shipping address string for email
      const shippingAddressStr = shippingMethod === 'HOME' 
        ? `${shippingAddress}, ${shippingPostalCode} ${shippingCity}, ${shippingCountry}`
        : `${boxProvider} - ${boxPointId}`;

      // If digital, create entitlement
      if (product.product_type === 'DIGITAL') {
        const { data: entitlement, error: entitlementError } = await supabase
          .from('digital_entitlements')
          .insert({
            order_id: order.id,
            product_id: product.id
          })
          .select()
          .single();

        if (entitlementError) throw entitlementError;

        // Send order confirmation email
        try {
          await supabase.functions.invoke('send-order-confirmation', {
            body: {
              customerName,
              customerEmail,
              orderId: order.id,
              productName: getTitle(),
              quantity,
              totalAmount: getTotalAmount(),
              currency: product.currency,
              productType: 'DIGITAL',
              downloadToken: entitlement.token
            }
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        toast.success(labels.successTitle);
        navigate(`/download/${entitlement.token}`);
      } else {
        // Send order confirmation email for physical product
        try {
          await supabase.functions.invoke('send-order-confirmation', {
            body: {
              customerName,
              customerEmail,
              orderId: order.id,
              productName: getTitle(),
              quantity,
              totalAmount: getTotalAmount(),
              currency: product.currency,
              productType: 'PHYSICAL',
              shippingAddress: shippingAddressStr
            }
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        toast.success(labels.successTitle);
        navigate(`/order-success/${order.id}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(labels.errorTitle, { description: labels.errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {language === 'en' ? 'Product not found' : language === 'es' ? 'Producto no encontrado' : 'A termék nem található'}
          </h1>
          <Button onClick={() => navigate('/tudastar')}>
            {labels.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Header */}
      <Header />

      <div className="container mx-auto px-4 pt-20 md:pt-24 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Purchase Flow */}
          <div className="order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Summary */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex gap-4 mb-4">
                  {/* Cover Thumbnail */}
                  <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                    {product.cover_image_url ? (
                      <img
                        src={product.cover_image_url}
                        alt={getTitle()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                      {getTitle()}
                    </h1>
                    {getSubtitle() && (
                      <p className="text-sm text-muted-foreground mb-2">{getSubtitle()}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {product.product_type === 'DIGITAL' ? (
                        <Badge variant="secondary" className="text-xs">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {labels.digital}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          {labels.physical}
                        </Badge>
                      )}
                      {product.is_featured && (
                        <Badge className="bg-primary text-primary-foreground text-xs">{labels.featured}</Badge>
                      )}
                      {product.is_on_sale && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs">{labels.sale}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity (only for physical) */}
                {product.product_type === 'PHYSICAL' && (
                  <div className="flex items-center justify-between py-4 border-t border-border">
                    <span className="text-sm font-medium">{labels.quantity}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Price Summary */}
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{labels.subtotal}</span>
                    <span>{formatPrice(getUnitPrice() * quantity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{labels.shipping}</span>
                    <span>
                      {product.product_type === 'DIGITAL' ? (
                        <span className="text-muted-foreground text-xs">{labels.noShipping}</span>
                      ) : getShippingFee() === 0 ? (
                        <span className="text-green-600">{labels.freeShipping}</span>
                      ) : (
                        formatPrice(getShippingFee())
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>{labels.total}</span>
                    <span className="text-primary">{formatPrice(getTotalAmount())}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-foreground mb-4">{labels.customerInfo}</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">{labels.name} *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{labels.email} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{labels.phone}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Info (only for physical) */}
              {product.product_type === 'PHYSICAL' && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold text-foreground mb-4">{labels.shippingInfo}</h3>
                  
                  <div className="mb-4">
                    <Label className="mb-2 block">{labels.shippingMethod}</Label>
                    <RadioGroup
                      value={shippingMethod}
                      onValueChange={(val) => {
                        setShippingMethod(val as 'HOME' | 'BOX');
                        const providers = val === 'HOME' ? homeProviders : boxProviders;
                        if (providers.length > 0) {
                          setSelectedProviderId(providers[0].id);
                        }
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="HOME" id="home" />
                        <Label htmlFor="home" className="cursor-pointer">{labels.homeDelivery}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="BOX" id="box" />
                        <Label htmlFor="box" className="cursor-pointer">{labels.boxDelivery}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Provider Selection */}
                  {shippingMethod === 'HOME' && homeProviders.length > 0 && (
                    <div className="mb-4">
                      <Label className="mb-2 block">Futárszolgálat</Label>
                      <RadioGroup
                        value={selectedProviderId}
                        onValueChange={setSelectedProviderId}
                        className="space-y-2"
                      >
                        {homeProviders.map((provider) => (
                          <div key={provider.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={provider.id} id={provider.id} />
                              <Label htmlFor={provider.id} className="cursor-pointer">{provider.name}</Label>
                            </div>
                            <span className="text-primary font-medium">{formatPrice(provider.fee)}</span>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {shippingMethod === 'BOX' && boxProviders.length > 0 && (
                    <div className="mb-4">
                      <Label className="mb-2 block">Csomagpont szolgáltató</Label>
                      <RadioGroup
                        value={selectedProviderId}
                        onValueChange={setSelectedProviderId}
                        className="space-y-2"
                      >
                        {boxProviders.map((provider) => (
                          <div key={provider.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={provider.id} id={provider.id} />
                              <Label htmlFor={provider.id} className="cursor-pointer">{provider.name}</Label>
                            </div>
                            <span className="text-primary font-medium">{formatPrice(provider.fee)}</span>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {shippingMethod === 'HOME' ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="country">{labels.country} *</Label>
                        <Input
                          id="country"
                          value={shippingCountry}
                          onChange={(e) => setShippingCountry(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="postalCode">{labels.postalCode} *</Label>
                          <Input
                            id="postalCode"
                            value={shippingPostalCode}
                            onChange={(e) => setShippingPostalCode(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">{labels.city} *</Label>
                          <Input
                            id="city"
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">{labels.address} *</Label>
                        <Input
                          id="address"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="boxProvider">{labels.boxProvider} *</Label>
                        <Input
                          id="boxProvider"
                          value={boxProvider}
                          onChange={(e) => setBoxProvider(e.target.value)}
                          placeholder="FoxPost, GLS, stb."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="boxPointId">{labels.boxPointId} *</Label>
                        <Input
                          id="boxPointId"
                          value={boxPointId}
                          onChange={(e) => setBoxPointId(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Billing Address (only for physical when not using box delivery) */}
              {product.product_type === 'PHYSICAL' && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold text-foreground mb-4">{labels.billingInfo}</h3>
                  
                  {shippingMethod === 'HOME' && (
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="billingSameAsShipping"
                        checked={billingSameAsShipping}
                        onCheckedChange={(checked) => setBillingSameAsShipping(checked === true)}
                      />
                      <Label htmlFor="billingSameAsShipping" className="text-sm cursor-pointer">
                        {labels.billingSameAsShipping}
                      </Label>
                    </div>
                  )}

                  {(shippingMethod === 'BOX' || !billingSameAsShipping) && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="billingCountry">{labels.country} *</Label>
                        <Input
                          id="billingCountry"
                          value={billingCountry}
                          onChange={(e) => setBillingCountry(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingPostalCode">{labels.postalCode} *</Label>
                          <Input
                            id="billingPostalCode"
                            value={billingPostalCode}
                            onChange={(e) => setBillingPostalCode(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingCity">{labels.city} *</Label>
                          <Input
                            id="billingCity"
                            value={billingCity}
                            onChange={(e) => setBillingCity(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="billingAddress">{labels.address} *</Label>
                        <Input
                          id="billingAddress"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase py-6 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  labels.processing
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {labels.buyNow}
                  </>
                )}
              </Button>
              
              {/* Add to Cart Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-base"
                onClick={() => {
                  if (!product) return;
                  addToCart({
                    id: product.id,
                    title: language === 'hu' ? product.title_hu : language === 'en' ? product.title_en : product.title_es,
                    price: product.price_gross,
                    salePrice: product.is_on_sale ? product.sale_price || undefined : undefined,
                    coverImageUrl: product.cover_image_url,
                    productType: product.product_type
                  });
                  toast.success('Termék kosárba helyezve!');
                }}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Kosárba helyezem
              </Button>
            </form>
          </div>

          {/* Right Column - Product Details */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-8 lg:self-start">
            {/* Cover Image */}
            <div className="aspect-[9/16] max-h-[500px] bg-muted rounded-lg overflow-hidden mb-6">
              {product.cover_image_url ? (
                <img
                  src={product.cover_image_url}
                  alt={getTitle()}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen className="w-24 h-24 text-primary/50" />
                </div>
              )}
            </div>

            {/* Excerpt */}
            {getExcerpt() && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-foreground mb-4">{labels.excerptTitle}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {getExcerpt()}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="mt-6">
              <p className="text-muted-foreground">
                {getDescription()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Buy Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{labels.total}</span>
          <span className="text-xl font-bold text-primary">{formatPrice(getTotalAmount())}</span>
        </div>
        <Button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {labels.buyNow}
        </Button>
      </div>
    </div>
  );
}
