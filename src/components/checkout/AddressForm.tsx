import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";

interface AddressData {
  country: string;
  postalCode: string;
  city: string;
  address: string;
}

interface AddressFormProps {
  type: 'shipping' | 'billing';
  data: AddressData;
  onChange: (data: AddressData) => void;
  showSameAsShipping?: boolean;
  sameAsShipping?: boolean;
  onSameAsShippingChange?: (same: boolean) => void;
  required?: boolean;
}

export function AddressForm({
  type,
  data,
  onChange,
  showSameAsShipping = false,
  sameAsShipping = true,
  onSameAsShippingChange,
  required = false,
}: AddressFormProps) {
  const { language } = useLanguage();

  const getLabels = () => {
    const labels: Record<string, Record<string, string>> = {
      hu: {
        shippingTitle: 'Postázási cím',
        billingTitle: 'Számlázási cím',
        sameAsShipping: 'Megegyezik a postázási címmel',
        country: 'Ország',
        postalCode: 'Irányítószám',
        city: 'Város',
        address: 'Utca, házszám',
      },
      en: {
        shippingTitle: 'Shipping Address',
        billingTitle: 'Billing Address',
        sameAsShipping: 'Same as shipping address',
        country: 'Country',
        postalCode: 'Postal Code',
        city: 'City',
        address: 'Street, House Number',
      },
      es: {
        shippingTitle: 'Dirección de Envío',
        billingTitle: 'Dirección de Facturación',
        sameAsShipping: 'Igual que la dirección de envío',
        country: 'País',
        postalCode: 'Código Postal',
        city: 'Ciudad',
        address: 'Calle, Número',
      },
    };
    return labels[language] || labels.hu;
  };

  const labels = getLabels();
  const title = type === 'shipping' ? labels.shippingTitle : labels.billingTitle;

  const handleChange = (field: keyof AddressData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <h3 className="font-bold text-foreground mb-4">{title}</h3>

      {showSameAsShipping && onSameAsShippingChange && (
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="sameAsShipping"
            checked={sameAsShipping}
            onCheckedChange={(checked) => onSameAsShippingChange(checked === true)}
          />
          <Label htmlFor="sameAsShipping" className="text-sm cursor-pointer">
            {labels.sameAsShipping}
          </Label>
        </div>
      )}

      {(!showSameAsShipping || !sameAsShipping) && (
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${type}-country`}>
              {labels.country} {required && '*'}
            </Label>
            <Input
              id={`${type}-country`}
              value={data.country}
              onChange={(e) => handleChange('country', e.target.value)}
              required={required}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${type}-postalCode`}>
                {labels.postalCode} {required && '*'}
              </Label>
              <Input
                id={`${type}-postalCode`}
                value={data.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                required={required}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${type}-city`}>
                {labels.city} {required && '*'}
              </Label>
              <Input
                id={`${type}-city`}
                value={data.city}
                onChange={(e) => handleChange('city', e.target.value)}
                required={required}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`${type}-address`}>
              {labels.address} {required && '*'}
            </Label>
            <Input
              id={`${type}-address`}
              value={data.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required={required}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
