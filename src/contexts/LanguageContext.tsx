import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Language = 'hu' | 'en' | 'es';

interface CMSSetting {
  key: string;
  lang: string;
  value: string | null;
  is_published: boolean;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
  refreshTranslations: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('hu');
  const [cmsTranslations, setCmsTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch CMS translations from database
  const fetchTranslations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cms_settings')
        .select('key, lang, value, is_published')
        .eq('is_published', true);

      if (error) {
        console.error('Error fetching CMS translations:', error);
        return;
      }

      if (data) {
        const translationsMap: Record<string, Record<string, string>> = {};
        
        data.forEach((item: CMSSetting) => {
          if (!translationsMap[item.lang]) {
            translationsMap[item.lang] = {};
          }
          if (item.value) {
            translationsMap[item.lang][item.key] = item.value;
          }
        });

        setCmsTranslations(translationsMap);
      }
    } catch (err) {
      console.error('Failed to fetch translations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('cms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cms_settings'
        },
        () => {
          // Refresh translations when CMS changes
          fetchTranslations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTranslations]);

  const refreshTranslations = useCallback(async () => {
    await fetchTranslations();
  }, [fetchTranslations]);

  const t = (key: string): string => {
    // First check CMS translations
    const cmsValue = cmsTranslations[language]?.[key];
    if (cmsValue) {
      return cmsValue;
    }

    // Fallback to hardcoded translations
    const keys = key.split('.');
    let value: any = defaultTranslations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading, refreshTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Default translations as fallback
const defaultTranslations: Record<Language, any> = {
  hu: {
    nav: {
      home: 'FŐOLDAL',
      about: 'RÓLAM',
      services: 'SZOLGÁLTATÁSOK'
    },
    hero: {
      consultation: 'KONZULTÁCIÓ',
      reserveSpot: 'FOGLALJ HELYET',
      name: 'DOMONKOS ZSOLT',
      intro: 'Szia, Zsolt vagyok. Táplálkozási és teljesítmény-coachként egyszerű, működő szokásokban hiszek – felesleges körök nélkül. Ha kell, ránézünk a laborodra is. A személyre szabott terved 14 napon belül nálad lesz – érthetően, követhetően.',
      trainHard: 'EDDZ KEMÉNYEN!',
      liveBetter: 'ÉLJ JOBBAN',
      discoverPotential: 'FEDEZD FEL A POTENCIÁLOD',
      expertCoaching: 'SZAKÉRTŐ COACHING',
      resultsDriven: 'EREDMÉNYORIENTÁLT PROGRAMOK',
      supportiveTribe: 'TÁMOGATÓ KÖZÖSSÉG',
      viewClasses: 'SZOLGÁLTATÁSOK MEGTEKINTÉSE →',
      joinUs: 'CSATLAKOZZ',
      takeMore: 'VÁLLALJ TÖBBET!'
    },
    featuredIn: {
      title: 'MEGJELENT',
      subtitle: 'Válogatás a megjelenésekből'
    },
    bio: {
      title: 'Rólam',
      text1: 'Domonkos Zsolt vagyok, táplálkozási és teljesítmény-coach. Segítek úgy összeállítani az étrendedet és az edzéstervedet, hogy illeszkedjen a napjaidhoz – bonyolítás nélkül.',
      text2: 'Ha szükséges, a laboreredményeidet is átbeszéljük, és ezek alapján finomítunk. A célom, hogy 14 napon belül kézhez kapd a személyre szabott tervedet, és közben érthető, emberi kommunikációra számíthass.'
    },
    process: {
      title: 'HOGYAN MŰKÖDIK?',
      step1Title: '1. Ingyenes konzultáció',
      step1Desc: 'Beszéljük át a céljaidat és a helyzetedből – tisztán, gyorsan.',
      step2Title: '2. Személyre szabott terv',
      step2Desc: 'Kapsz egy étrendet és edzéstervet, amit valóban be tudsz illeszteni az életedbe.',
      step3Title: '3. Követés és finomítás',
      step3Desc: 'Nem maradsz magadra – szükség szerint frissítjük a tervet, amíg nem működik.'
    },
    b2b: {
      title: 'Céges egészségprogram – min. 8 főtől',
      description: 'Hozzuk formába a csapatot – kérj visszahívást, és kitaláljuk a nektek működő megoldást.',
      button: 'Ajánlatot kérek',
      pageTitle: 'B2B Ajánlatkérés',
      company: 'Cégnév',
      contactPerson: 'Kapcsolattartó',
      email: 'Email',
      phone: 'Telefon',
      headcount: 'Létszám (min. 8 fő)',
      message: 'Üzenet',
      gdpr: 'Elfogadom az adatkezelést',
      submit: 'Elküldöm',
      successMsg: 'Köszönjük! Hamarosan keresünk.',
      errorMsg: 'Hiba történt'
    },
    faq: {
      title: 'Gyakori kérdések',
      q1: 'Mennyi idő alatt látok eredményt?',
      a1: 'Az első változások általában 2-4 héten belül érezhetők, de a tartós eredmény 8-12 héten belül alakul ki.',
      q2: 'Milyen gyakran kell edzeni?',
      a2: 'Személyre szabottan, de általában heti 3-4 alkalom ajánlott az optimális eredményekért.',
      q3: 'Kell-e speciális felszerelés?',
      a3: 'Az edzésterv az elérhető eszközeihez igazodik – otthoni vagy edzőtermi edzéshez egyaránt.',
      q4: 'Hogyan zajlik a táplálkozási coaching?',
      a4: 'Egyéni konzultáció után személyre szabott étrendet kapsz, amit a napjaidhoz igazítunk – és szükség szerint módosítunk.'
    },
    contact: {
      title: 'Lépj kapcsolatba',
      name: 'Név',
      email: 'Email',
      message: 'Üzenet',
      submit: 'Küldés'
    },
    footer: {
      contact: 'KAPCSOLAT',
      email: 'Email: info@domonkoszsolt.hu',
      phone: 'Telefon: +36 30 123 4567',
      openingHours: 'NYITVATARTÁS',
      monFri: 'HÉT – PÉN: 6:00 – 22:00',
      saturday: 'SZOMBAT: 8:00 – 20:00',
      sunday: 'VASÁRNAP: 8:00 – 18:00',
      social: 'KÖZÖSSÉGI MÉDIA',
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn'
    },
    services: {
      title: 'Szolgáltatások',
      description: 'Válaszd ki azt, ami most a legjobban passzol a céljaidhoz',
      freeTitle: 'Díjmentes Személyes Konzultáció',
      freeDesc: '15 perces személyes konzultáció, ahol megbeszéljük céljaidat és kidolgozzuk a számodra legmegfelelőbb stratégiát.',
      freeBadge: 'INGYENES',
      bookNow: 'Foglalok Most',
      consultations: 'Konzultációk',
      nutritionPlans: 'Étrendtervek',
      workoutPlans: 'Edzéstervek',
      packages: 'Kombinált Csomagok',
      vat: '* AAM: Az árak az ÁFA összegét nem tartalmazzák.',
      featured: 'AJÁNLOTT',
      netPrice: 'Nettó ár (AAM)',
      selectBtn: 'Választom',
      consultation1: 'Online Konzultáció',
      consultation1Desc: '30 perces online konzultáció videóhívás során',
      consultation2: 'Személyes Konzultáció',
      consultation2Desc: '60 perces személyes konzultáció budapesti irodában',
      consultation3: 'Követéses Konzultáció',
      consultation3Desc: '4 hetes folyamatos követés heti konzultációkkal',
      nutrition1: 'Fogyókúrás Étrendterv',
      nutrition1Desc: 'Személyre szabott étrendterv súlycsökkentéshez, részletes receptekkel',
      nutrition2: 'Izomépítő Étrendterv',
      nutrition2Desc: 'Izomtömeg növelésre optimalizált étkezési terv',
      nutrition3: 'Egyéni Igényű Étrendterv',
      nutrition3Desc: 'Teljes mértékben személyre szabott étrendterv minden célra',
      workout1: 'Otthoni Edzésterv',
      workout1Desc: '4 hetes edzésprogram otthoni körülményekhez szabva',
      workout2: 'Edzőtermi Edzésterv',
      workout2Desc: 'Professzionális edzésterv edzőtermi eszközökhöz',
      workout3: 'Funkcionális Edzésterv',
      workout3Desc: 'Funkcionális tréning alapú egyéni edzésprogram',
      package1: 'Kezdő Csomag',
      package1Desc: 'Étrendterv + Edzésterv + 1 konzultáció',
      package2: 'Teljes Transformáció',
      package2Desc: 'Étrendterv + Edzésterv + 4 heti követés + korlátlan konzultáció',
      package3: 'Haladó Csomag',
      package3Desc: 'Teljes körű támogatás 12 héten keresztül minden szolgáltatással'
    },
    checkout: {
      title: 'Checkout',
      subtitle: 'Checkout oldal fejlesztés alatt (SimplePay, Számlázz.hu integráció következik)'
    },
    books: {
      title: 'Könyvek',
      subtitle: 'Tudás és inspiráció a fitness utadhoz',
      viewDetails: 'Részletek',
      digital: 'E-könyv (online)',
      physical: 'Fizikai könyv (offline)',
      featured: 'Kiemelt',
      sale: 'Akció'
    }
  },
  en: {
    nav: {
      home: 'HOME',
      about: 'ABOUT',
      services: 'SERVICES'
    },
    hero: {
      consultation: 'CONSULTATION',
      reserveSpot: 'RESERVE YOUR SPOT',
      name: 'ZSOLT DOMONKOS',
      intro: 'Hi, I\'m Zsolt. As a nutrition and performance coach, I believe in simple, effective habits – no unnecessary complications. If needed, we\'ll review your lab results too. You\'ll receive your personalized plan within 14 days – clearly and understandably.',
      trainHard: 'TRAIN HARD.',
      liveBetter: 'LIVE BETTER',
      discoverPotential: 'DISCOVER YOUR POTENTIAL',
      expertCoaching: 'EXPERT COACHING',
      resultsDriven: 'RESULTS-DRIVEN PROGRAMS',
      supportiveTribe: 'A SUPPORTIVE TRIBE',
      viewClasses: 'VIEW CLASSES →',
      joinUs: 'JOIN US',
      takeMore: 'TAKE ON MORE!'
    },
    featuredIn: {
      title: 'FEATURED IN',
      subtitle: 'Selection of appearances'
    },
    bio: {
      title: 'About Me',
      text1: 'I\'m Zsolt Domonkos, a nutrition and performance coach. I help you create a diet and training plan that fits into your daily life – without complications.',
      text2: 'If necessary, we\'ll review your lab results and refine accordingly. My goal is to deliver your personalized plan within 14 days, with clear and human communication throughout.'
    },
    process: {
      title: 'HOW IT WORKS?',
      step1Title: '1. Free consultation',
      step1Desc: 'Let\'s discuss your goals and situation – clearly and quickly.',
      step2Title: '2. Personalized plan',
      step2Desc: 'You\'ll get a diet and workout plan that actually fits into your life.',
      step3Title: '3. Follow-up and refinement',
      step3Desc: 'You won\'t be left alone – we\'ll update the plan as needed until it works.'
    },
    b2b: {
      title: 'Corporate wellness program – min. 8 people',
      description: 'Let\'s get your team in shape – request a callback and we\'ll figure out the solution that works for you.',
      button: 'Request a quote',
      pageTitle: 'B2B Quote Request',
      company: 'Company Name',
      contactPerson: 'Contact Person',
      email: 'Email',
      phone: 'Phone',
      headcount: 'Headcount (min. 8 people)',
      message: 'Message',
      gdpr: 'I accept the data processing',
      submit: 'Submit',
      successMsg: 'Thank you! We will contact you soon.',
      errorMsg: 'An error occurred'
    },
    faq: {
      title: 'Frequently Asked Questions',
      q1: 'How soon will I see results?',
      a1: 'The first changes are usually noticeable within 2-4 weeks, but lasting results develop within 8-12 weeks.',
      q2: 'How often do I need to train?',
      a2: 'Personalized, but generally 3-4 sessions per week are recommended for optimal results.',
      q3: 'Do I need special equipment?',
      a3: 'The training plan adapts to your available equipment – suitable for both home and gym workouts.',
      q4: 'How does nutrition coaching work?',
      a4: 'After an individual consultation, you\'ll receive a personalized diet plan tailored to your days – and we\'ll modify it as needed.'
    },
    contact: {
      title: 'Get in touch',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      submit: 'Send'
    },
    footer: {
      contact: 'CONTACT',
      email: 'Email: info@domonkoszsolt.hu',
      phone: 'Phone: +36 30 123 4567',
      openingHours: 'OPENING HOURS',
      monFri: 'MON – FRI: 6:00 – 22:00',
      saturday: 'SATURDAY: 8:00 – 20:00',
      sunday: 'SUNDAY: 8:00 – 18:00',
      social: 'SOCIAL',
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn'
    },
    services: {
      title: 'Services',
      description: 'Choose the program that best fits your goals',
      freeTitle: 'Free Personal Consultation',
      freeDesc: '15-minute personal consultation where we discuss your goals and develop the best strategy for you.',
      freeBadge: 'FREE',
      bookNow: 'Book Now',
      consultations: 'Consultations',
      nutritionPlans: 'Nutrition Plans',
      workoutPlans: 'Workout Plans',
      packages: 'Combined Packages',
      vat: '* Note: Prices do not include VAT.',
      featured: 'FEATURED',
      netPrice: 'Net price (excl. VAT)',
      selectBtn: 'Select',
      consultation1: 'Online Consultation',
      consultation1Desc: '30-minute online consultation via video call',
      consultation2: 'Personal Consultation',
      consultation2Desc: '60-minute personal consultation in Budapest office',
      consultation3: 'Follow-up Consultation',
      consultation3Desc: '4 weeks of continuous follow-up with weekly consultations',
      nutrition1: 'Weight Loss Meal Plan',
      nutrition1Desc: 'Personalized meal plan for weight reduction with detailed recipes',
      nutrition2: 'Muscle Building Meal Plan',
      nutrition2Desc: 'Nutrition plan optimized for muscle mass growth',
      nutrition3: 'Custom Meal Plan',
      nutrition3Desc: 'Fully personalized meal plan for any goal',
      workout1: 'Home Workout Plan',
      workout1Desc: '4-week training program adapted to home conditions',
      workout2: 'Gym Workout Plan',
      workout2Desc: 'Professional training plan for gym equipment',
      workout3: 'Functional Training Plan',
      workout3Desc: 'Individual training program based on functional training',
      package1: 'Starter Package',
      package1Desc: 'Meal Plan + Workout Plan + 1 consultation',
      package2: 'Complete Transformation',
      package2Desc: 'Meal Plan + Workout Plan + 4-week follow-up + unlimited consultations',
      package3: 'Advanced Package',
      package3Desc: 'Comprehensive support for 12 weeks with all services'
    },
    checkout: {
      title: 'Checkout',
      subtitle: 'Checkout page under development (SimplePay, Számlázz.hu integration coming)'
    },
    books: {
      title: 'Books',
      subtitle: 'Knowledge and inspiration for your fitness journey',
      viewDetails: 'View Details',
      digital: 'E-book (online)',
      physical: 'Physical book (offline)',
      featured: 'Featured',
      sale: 'Sale'
    }
  },
  es: {
    nav: {
      home: 'INICIO',
      about: 'SOBRE MÍ',
      services: 'SERVICIOS'
    },
    hero: {
      consultation: 'CONSULTA',
      reserveSpot: 'RESERVA TU LUGAR',
      name: 'ZSOLT DOMONKOS',
      intro: 'Hola, soy Zsolt. Como entrenador de nutrición y rendimiento, creo en hábitos simples y efectivos, sin complicaciones innecesarias. Si es necesario, revisaremos tus resultados de laboratorio también. Recibirás tu plan personalizado en 14 días, de manera clara y comprensible.',
      trainHard: 'ENTRENA DURO.',
      liveBetter: 'VIVE MEJOR',
      discoverPotential: 'DESCUBRE TU POTENCIAL',
      expertCoaching: 'ENTRENAMIENTO EXPERTO',
      resultsDriven: 'PROGRAMAS ORIENTADOS A RESULTADOS',
      supportiveTribe: 'UNA COMUNIDAD DE APOYO',
      viewClasses: 'VER CLASES →',
      joinUs: 'ÚNETE',
      takeMore: '¡ASUME MÁS!'
    },
    featuredIn: {
      title: 'DESTACADO EN',
      subtitle: 'Selección de apariciones'
    },
    bio: {
      title: 'Sobre mí',
      text1: 'Soy Zsolt Domonkos, entrenador de nutrición y rendimiento. Te ayudo a crear una dieta y un plan de entrenamiento que se adapte a tu vida diaria, sin complicaciones.',
      text2: 'Si es necesario, revisaremos tus resultados de laboratorio y ajustaremos en consecuencia. Mi objetivo es entregar tu plan personalizado en 14 días, con una comunicación clara y humana en todo momento.'
    },
    process: {
      title: '¿CÓMO FUNCIONA?',
      step1Title: '1. Consulta gratuita',
      step1Desc: 'Hablemos sobre tus objetivos y situación, de manera clara y rápida.',
      step2Title: '2. Plan personalizado',
      step2Desc: 'Recibirás una dieta y un plan de entrenamiento que realmente encaja en tu vida.',
      step3Title: '3. Seguimiento y refinamiento',
      step3Desc: 'No te quedarás solo: actualizaremos el plan según sea necesario hasta que funcione.'
    },
    b2b: {
      title: 'Programa de bienestar corporativo – mín. 8 personas',
      description: 'Pongamos en forma a tu equipo: solicita una llamada y encontraremos la solución que funcione para ti.',
      button: 'Solicitar presupuesto',
      pageTitle: 'Solicitud de presupuesto B2B',
      company: 'Nombre de la empresa',
      contactPerson: 'Persona de contacto',
      email: 'Email',
      phone: 'Teléfono',
      headcount: 'Número de personas (mín. 8)',
      message: 'Mensaje',
      gdpr: 'Acepto el procesamiento de datos',
      submit: 'Enviar',
      successMsg: '¡Gracias! Nos pondremos en contacto pronto.',
      errorMsg: 'Ocurrió un error'
    },
    faq: {
      title: 'Preguntas frecuentes',
      q1: '¿Cuándo veré resultados?',
      a1: 'Los primeros cambios suelen notarse en 2-4 semanas, pero los resultados duraderos se desarrollan en 8-12 semanas.',
      q2: '¿Con qué frecuencia necesito entrenar?',
      a2: 'Personalizado, pero generalmente se recomiendan 3-4 sesiones por semana para obtener resultados óptimos.',
      q3: '¿Necesito equipo especial?',
      a3: 'El plan de entrenamiento se adapta a tu equipo disponible: adecuado tanto para entrenamientos en casa como en el gimnasio.',
      q4: '¿Cómo funciona el coaching nutricional?',
      a4: 'Después de una consulta individual, recibirás un plan de dieta personalizado adaptado a tus días, y lo modificaremos según sea necesario.'
    },
    contact: {
      title: 'Ponte en contacto',
      name: 'Nombre',
      email: 'Email',
      message: 'Mensaje',
      submit: 'Enviar'
    },
    footer: {
      contact: 'CONTACTO',
      email: 'Email: info@domonkoszsolt.hu',
      phone: 'Teléfono: +36 30 123 4567',
      openingHours: 'HORARIO',
      monFri: 'LUN – VIE: 6:00 – 22:00',
      saturday: 'SÁBADO: 8:00 – 20:00',
      sunday: 'DOMINGO: 8:00 – 18:00',
      social: 'REDES SOCIALES',
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn'
    },
    services: {
      title: 'Servicios',
      description: 'Elige el programa que mejor se adapte a tus objetivos',
      freeTitle: 'Consulta Personal Gratuita',
      freeDesc: 'Consulta personal de 15 minutos donde discutimos tus objetivos y desarrollamos la mejor estrategia para ti.',
      freeBadge: 'GRATIS',
      bookNow: 'Reservar Ahora',
      consultations: 'Consultas',
      nutritionPlans: 'Planes de nutrición',
      workoutPlans: 'Planes de entrenamiento',
      packages: 'Paquetes combinados',
      vat: '* Nota: Los precios no incluyen IVA.',
      featured: 'DESTACADO',
      netPrice: 'Precio neto (sin IVA)',
      selectBtn: 'Seleccionar',
      consultation1: 'Consulta Online',
      consultation1Desc: 'Consulta en línea de 30 minutos a través de videollamada',
      consultation2: 'Consulta Personal',
      consultation2Desc: 'Consulta personal de 60 minutos en la oficina de Budapest',
      consultation3: 'Consulta de Seguimiento',
      consultation3Desc: '4 semanas de seguimiento continuo con consultas semanales',
      nutrition1: 'Plan de Pérdida de Peso',
      nutrition1Desc: 'Plan de comidas personalizado para reducción de peso con recetas detalladas',
      nutrition2: 'Plan de Construcción Muscular',
      nutrition2Desc: 'Plan de nutrición optimizado para el crecimiento de masa muscular',
      nutrition3: 'Plan de Comidas Personalizado',
      nutrition3Desc: 'Plan de comidas completamente personalizado para cualquier objetivo',
      workout1: 'Plan de Entrenamiento en Casa',
      workout1Desc: 'Programa de entrenamiento de 4 semanas adaptado a condiciones del hogar',
      workout2: 'Plan de Entrenamiento en Gimnasio',
      workout2Desc: 'Plan de entrenamiento profesional para equipos de gimnasio',
      workout3: 'Plan de Entrenamiento Funcional',
      workout3Desc: 'Programa de entrenamiento individual basado en entrenamiento funcional',
      package1: 'Paquete Inicial',
      package1Desc: 'Plan de Comidas + Plan de Entrenamiento + 1 consulta',
      package2: 'Transformación Completa',
      package2Desc: 'Plan de Comidas + Plan de Entrenamiento + 4 semanas de seguimiento + consultas ilimitadas',
      package3: 'Paquete Avanzado',
      package3Desc: 'Soporte integral durante 12 semanas con todos los servicios'
    },
    checkout: {
      title: 'Checkout',
      subtitle: 'Página de pago en desarrollo (integración con SimplePay, Számlázz.hu próximamente)'
    },
    books: {
      title: 'Libros',
      subtitle: 'Conocimiento e inspiración para tu viaje fitness',
      viewDetails: 'Ver detalles',
      digital: 'E-libro (en línea)',
      physical: 'Libro físico (offline)',
      featured: 'Destacado',
      sale: 'Oferta'
    }
  }
};
