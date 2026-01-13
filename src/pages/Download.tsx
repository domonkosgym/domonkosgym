import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download as DownloadIcon, BookOpen, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

interface Entitlement {
  id: string;
  order_id: string;
  product_id: string;
  token: string;
  expires_at: string;
  download_count: number;
  max_downloads: number;
}

interface Product {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  file_asset_url: string | null;
  cover_image_url: string | null;
}

export default function Download() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('invalid_token');
        setLoading(false);
        return;
      }

      // Fetch entitlement by token
      const { data: entitlementData, error: entitlementError } = await supabase
        .from('digital_entitlements')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (entitlementError || !entitlementData) {
        setError('not_found');
        setLoading(false);
        return;
      }

      const ent = entitlementData as Entitlement;

      // Check expiration
      if (new Date(ent.expires_at) < new Date()) {
        setError('expired');
        setLoading(false);
        return;
      }

      // Check download limit
      if (ent.download_count >= ent.max_downloads) {
        setError('limit_reached');
        setLoading(false);
        return;
      }

      setEntitlement(ent);

      // Fetch product details
      const { data: productData } = await supabase
        .from('products')
        .select('id, title_hu, title_en, title_es, file_asset_url, cover_image_url')
        .eq('id', ent.product_id)
        .maybeSingle();

      if (productData) {
        setProduct(productData as Product);
      }

      setLoading(false);
    };

    fetchData();
  }, [token]);

  const getTitle = () => {
    if (!product) return '';
    switch (language) {
      case 'en': return product.title_en;
      case 'es': return product.title_es;
      default: return product.title_hu;
    }
  };

  const getLabels = () => {
    const labels: Record<string, Record<string, string>> = {
      hu: {
        pageTitle: 'Letöltés',
        downloadReady: 'A letöltésed készen áll!',
        downloadBtn: 'Letöltés',
        downloading: 'Letöltés folyamatban...',
        downloadsRemaining: 'Hátralévő letöltések',
        expiresAt: 'Lejárat',
        errorNotFound: 'A letöltési link nem található vagy érvénytelen.',
        errorExpired: 'A letöltési link lejárt.',
        errorLimitReached: 'Elérted a maximális letöltési limitet.',
        errorInvalidToken: 'Érvénytelen letöltési token.',
        errorNoFile: 'A fájl nem érhető el.',
        backToHome: 'Vissza a főoldalra',
        successDownload: 'Sikeres letöltés!'
      },
      en: {
        pageTitle: 'Download',
        downloadReady: 'Your download is ready!',
        downloadBtn: 'Download',
        downloading: 'Downloading...',
        downloadsRemaining: 'Downloads remaining',
        expiresAt: 'Expires',
        errorNotFound: 'Download link not found or invalid.',
        errorExpired: 'Download link has expired.',
        errorLimitReached: 'Maximum download limit reached.',
        errorInvalidToken: 'Invalid download token.',
        errorNoFile: 'File not available.',
        backToHome: 'Back to Home',
        successDownload: 'Download successful!'
      },
      es: {
        pageTitle: 'Descargar',
        downloadReady: '¡Tu descarga está lista!',
        downloadBtn: 'Descargar',
        downloading: 'Descargando...',
        downloadsRemaining: 'Descargas restantes',
        expiresAt: 'Expira',
        errorNotFound: 'Enlace de descarga no encontrado o inválido.',
        errorExpired: 'El enlace de descarga ha expirado.',
        errorLimitReached: 'Límite máximo de descargas alcanzado.',
        errorInvalidToken: 'Token de descarga inválido.',
        errorNoFile: 'Archivo no disponible.',
        backToHome: 'Volver al inicio',
        successDownload: '¡Descarga exitosa!'
      }
    };
    return labels[language] || labels.hu;
  };

  const labels = getLabels();

  const getErrorMessage = () => {
    switch (error) {
      case 'not_found': return labels.errorNotFound;
      case 'expired': return labels.errorExpired;
      case 'limit_reached': return labels.errorLimitReached;
      case 'invalid_token': return labels.errorInvalidToken;
      case 'no_file': return labels.errorNoFile;
      default: return labels.errorNotFound;
    }
  };

  const handleDownload = async () => {
    if (!entitlement || !product) return;

    if (!product.file_asset_url) {
      toast.error(labels.errorNoFile);
      return;
    }

    setDownloading(true);

    try {
      // Get signed URL from private storage bucket
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('book-files')
        .createSignedUrl(product.file_asset_url, 60); // 60 seconds validity

      if (signedUrlError || !signedUrlData?.signedUrl) {
        // Fallback: if file_asset_url is a full URL (legacy), use it directly
        if (product.file_asset_url.startsWith('http')) {
          // Increment download count first
          await supabase
            .from('digital_entitlements')
            .update({ download_count: entitlement.download_count + 1 })
            .eq('id', entitlement.id);

          setEntitlement({
            ...entitlement,
            download_count: entitlement.download_count + 1
          });

          window.open(product.file_asset_url, '_blank');
          toast.success(labels.successDownload);
          return;
        }
        throw new Error('Unable to generate download link');
      }

      // Increment download count
      await supabase
        .from('digital_entitlements')
        .update({ download_count: entitlement.download_count + 1 })
        .eq('id', entitlement.id);

      // Update local state
      setEntitlement({
        ...entitlement,
        download_count: entitlement.download_count + 1
      });

      // Trigger download with signed URL
      window.open(signedUrlData.signedUrl, '_blank');
      toast.success(labels.successDownload);
    } catch (err) {
      console.error('Download error:', err);
      toast.error(labels.errorNoFile);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'hu' ? 'hu-HU' : language === 'es' ? 'es-ES' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {labels.pageTitle}
          </h1>
          <p className="text-muted-foreground mb-8">
            {getErrorMessage()}
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {labels.backToHome}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {labels.downloadReady}
        </h1>

        {/* Product Card */}
        <div className="bg-card border border-border rounded-lg p-6 mt-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            {product?.cover_image_url ? (
              <img
                src={product.cover_image_url}
                alt={getTitle()}
                className="w-16 h-24 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="text-left flex-1">
              <h3 className="font-bold text-foreground">{getTitle()}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {labels.downloadsRemaining}: {entitlement ? entitlement.max_downloads - entitlement.download_count : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {labels.expiresAt}: {entitlement ? formatDate(entitlement.expires_at) : ''}
              </p>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase"
          >
            {downloading ? (
              labels.downloading
            ) : (
              <>
                <DownloadIcon className="w-5 h-5 mr-2" />
                {labels.downloadBtn}
              </>
            )}
          </Button>
        </div>

        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {labels.backToHome}
        </Button>
      </div>
    </div>
  );
}
