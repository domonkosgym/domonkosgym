import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

export const useAnalytics = () => {
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const pageStartTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const scrollListenerAdded = useRef(false);
  const formStartTracked = useRef<Set<string>>(new Set());

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
    
    if (scrollPercent > maxScrollDepth.current) {
      maxScrollDepth.current = Math.min(scrollPercent, 100);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async () => {
    const timeOnPage = Math.round((Date.now() - pageStartTime.current) / 1000);
    
    await supabase.from('page_views').insert({
      page_path: location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      ip_address: null,
      session_id: sessionId.current,
      scroll_depth: maxScrollDepth.current,
      time_on_page: timeOnPage,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      is_exit_page: false
    });

    // Update session metrics
    const { data: existingSession } = await supabase
      .from('session_metrics')
      .select('*')
      .eq('session_id', sessionId.current)
      .maybeSingle();

    if (existingSession) {
      await supabase
        .from('session_metrics')
        .update({
          last_activity: new Date().toISOString(),
          total_duration: existingSession.total_duration + timeOnPage,
          page_count: existingSession.page_count + 1
        })
        .eq('session_id', sessionId.current);
    } else {
      await supabase.from('session_metrics').insert({
        session_id: sessionId.current,
        device_type: getDeviceType(),
        is_returning_visitor: !!document.cookie.includes('returning_visitor')
      });
      
      // Set returning visitor cookie
      document.cookie = 'returning_visitor=true; max-age=31536000; path=/';
    }
  }, [location.pathname]);

  // Track CTA click
  const trackCTAClick = useCallback(async (ctaText: string, ctaType: string) => {
    await supabase.from('cta_clicks').insert({
      session_id: sessionId.current,
      page_path: location.pathname,
      cta_text: ctaText,
      cta_type: ctaType,
      user_agent: navigator.userAgent,
      ip_address: null
    });
  }, [location.pathname]);

  // Track form interaction
  const trackFormStart = useCallback(async (formType: string) => {
    // Check if already tracked for this session
    if (formStartTracked.current.has(formType)) {
      return;
    }
    
    const interactionId = `form_${formType}_${Date.now()}`;
    sessionStorage.setItem(`form_${formType}_id`, interactionId);
    sessionStorage.setItem(`form_${formType}_start`, Date.now().toString());
    
    await supabase.from('form_interactions').insert({
      id: interactionId,
      session_id: sessionId.current,
      form_type: formType,
      started_at: new Date().toISOString()
    });

    formStartTracked.current.add(formType);
  }, []);

  const trackFormComplete = useCallback(async (formType: string, fieldsData?: any) => {
    const interactionId = sessionStorage.getItem(`form_${formType}_id`);
    if (!interactionId) return;

    const startTime = sessionStorage.getItem(`form_${formType}_start`);
    const timeSpent = startTime ? Math.round((Date.now() - parseInt(startTime)) / 1000) : 0;

    await supabase
      .from('form_interactions')
      .update({
        completed_at: new Date().toISOString(),
        fields_filled: fieldsData,
        time_spent: timeSpent
      })
      .eq('id', interactionId);

    sessionStorage.removeItem(`form_${formType}_id`);
    sessionStorage.removeItem(`form_${formType}_start`);
    formStartTracked.current.delete(formType);
  }, []);

  const trackFormAbandon = useCallback(async (formType: string) => {
    const interactionId = sessionStorage.getItem(`form_${formType}_id`);
    if (!interactionId) return;

    await supabase
      .from('form_interactions')
      .update({ abandoned: true })
      .eq('id', interactionId);
      
    formStartTracked.current.delete(formType);
  }, []);

  useEffect(() => {
    pageStartTime.current = Date.now();
    maxScrollDepth.current = 0;
    formStartTracked.current.clear();

    // Add scroll listener
    if (!scrollListenerAdded.current) {
      window.addEventListener('scroll', trackScrollDepth);
      scrollListenerAdded.current = true;
    }

    // Track page view on unmount
    return () => {
      trackPageView();
    };
  }, [location.pathname, trackPageView, trackScrollDepth]);

  return {
    trackCTAClick,
    trackFormStart,
    trackFormComplete,
    trackFormAbandon
  };
};
