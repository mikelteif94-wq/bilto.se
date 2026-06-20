import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { slugToCity, slugToBrand } from './lib/seo-pages';

const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const SellCarPage = lazy(() => import('./pages/SellCarPage'));
const BuyCarPage = lazy(() => import('./pages/BuyCarPage'));
const DealerRegister = lazy(() => import('./pages/DealerRegister'));
const DealerLogin = lazy(() => import('./pages/DealerLogin'));
const DealerCarsList = lazy(() => import('./pages/DealerCarsList'));
const DealerOverview = lazy(() => import('./pages/DealerOverview'));
const DealerCarDetail = lazy(() => import('./pages/DealerCarDetail'));
const DealerAddCar = lazy(() => import('./pages/DealerAddCar'));
const DealerSettings = lazy(() => import('./pages/DealerSettings'));
const DealerInventorySync = lazy(() => import('./pages/DealerInventorySync'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminOverview = lazy(() => import('./pages/AdminOverview'));
const AdminCars = lazy(() => import('./pages/AdminCars'));
const AdminCarDetail = lazy(() => import('./pages/AdminCarDetail'));
const AdminAddCar = lazy(() => import('./pages/AdminAddCar'));
const AdminDealers = lazy(() => import('./pages/AdminDealers'));
const AdminDealerDetail = lazy(() => import('./pages/AdminDealerDetail'));
const AdminQuoteDetail = lazy(() => import('./pages/AdminQuoteDetail'));
const AdminOfferEditor = lazy(() => import('./pages/AdminOfferEditor'));
const AdminDealerProposalEditor = lazy(() => import('./pages/AdminDealerProposalEditor'));
const AdminBulkUpload = lazy(() => import('./pages/AdminBulkUpload'));
const AdminQuizSubmissions = lazy(() => import('./pages/AdminQuizSubmissions'));
const AdminLeadCommandCenter = lazy(() => import('./pages/AdminLeadCommandCenter'));
const AdminCarCatalog = lazy(() => import('./pages/AdminCarCatalog'));
const AdminCatalogImport = lazy(() => import('./pages/AdminCatalogImport'));
const MyCarPage = lazy(() => import('./pages/MyCarPage'));
const MyQuotePage = lazy(() => import('./pages/MyQuotePage'));
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'));
const CustomerLogin = lazy(() => import('./pages/CustomerLogin'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const PortalCallbackPage = lazy(() => import('./pages/PortalCallbackPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CompareCarsPage = lazy(() => import('./pages/CompareCarsPage'));
const SaljBilMedHjalp = lazy(() => import('./pages/SaljBilMedHjalp'));
const KopBilConcierge = lazy(() => import('./pages/KopBilConcierge'));
const SeoLandingPage = lazy(() => import('./pages/SeoLandingPage'));
const WebbplatskartaPage = lazy(() => import('./pages/WebbplatskartaPage'));
const ExploreCarsPage = lazy(() => import('./pages/ExploreCarsPage'));
const FreeConsultationPage = lazy(() => import('./pages/FreeConsultationPage'));
const SaFunkarDetPage = lazy(() => import('./pages/SaFunkarDetPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
  </div>
);

type PublicRoute =
  | { page: 'home' }
  | { page: 'sell'; regnummer: string; telefon?: string; miltal?: number }
;

const _initParams = new URLSearchParams(window.location.search);
const _initEmail = _initParams.get('mejl') ?? '';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function matchAdminCarDetail(path: string): string | null {
  const m = path.match(/^\/admin\/bilar\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchAdminDealerDetail(path: string): string | null {
  const m = path.match(/^\/admin\/handlare\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchAdminQuoteDetail(path: string): string | null {
  const m = path.match(/^\/admin\/forfragningar\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchAdminProposalNew(path: string): string | null {
  const m = path.match(/^\/admin\/bilar\/([^/]+)\/forslag\/nytt\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchAdminOfferEdit(path: string): string | null {
  const m = path.match(/^\/admin\/erbjudanden\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchAdminOfferNew(path: string): string | null {
  const m = path.match(/^\/admin\/erbjudanden\/nytt\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchDealerCarDetail(path: string): string | null {
  const m = path.match(/^\/handlare\/bilar\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchMyCar(path: string): string | null {
  const m = path.match(/^\/min-bil\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function matchMyQuote(path: string): string | null {
  const m = path.match(/^\/min-forfragan\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function detectRecovery(): boolean {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  if (hash.includes('type=recovery') || search.includes('type=recovery')) return true;
  if (window.location.pathname === '/handlare/valj-losenord') return true;
  if (window.location.pathname === '/valj-losenord') return true;
  return false;
}

function App() {
  const [publicRoute, setPublicRoute] = useState<PublicRoute>({ page: 'home' });
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState<boolean>(detectRecovery());
  const [recoveryTarget, setRecoveryTarget] = useState<string>('/handlare/oversikt');
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [path]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
      if (event === 'PASSWORD_RECOVERY') {
        const isCustomer = sessionStorage.getItem('bilto_portal') === 'customer';
        const recoveryPath = isCustomer ? '/valj-losenord' : '/handlare/valj-losenord';
        setRecoveryTarget(isCustomer ? '/mina-bilar' : '/handlare/oversikt');
        setRecoveryMode(true);
        if (window.location.pathname !== recoveryPath) {
          window.history.replaceState({}, '', recoveryPath);
          setPath(recoveryPath);
        }
      }
      if (event === 'SIGNED_IN' && newSession && !sessionStorage.getItem('bilto_portal')) {
        const p = window.location.pathname;
        const isDealerPath = p.startsWith('/handlare') || p.startsWith('/admin');
        if (!isDealerPath) {
          sessionStorage.setItem('bilto_portal', 'customer');
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const onAdminRouteBool = path.startsWith('/admin');
  useEffect(() => {
    if (!session || !onAdminRouteBool) {
      setAdminVerified(null);
      return;
    }
    let cancelled = false;
    supabase
      .rpc('get_is_admin')
      .then(({ data }) => {
        if (!cancelled) setAdminVerified(!!data);
      });
    return () => { cancelled = true; };
  }, [session?.user?.id, onAdminRouteBool]);

  if (recoveryMode) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SetPasswordPage
          onDone={() => {
            setRecoveryMode(false);
            navigate(recoveryTarget);
          }}
        />
      </Suspense>
    );
  }

  const onCustomerLogin = path === '/logga-in';
  const onCustomerDashboard = path === '/mina-bilar';
  const onAdminRoute = path.startsWith('/admin');
  const onDealerRegister = path === '/handlare/registrera';
  const onDealerApply = path === '/handlare/ansok';
  const onDealerLogin = path === '/handlare/logga-in';
  const onDealerApp =
    path === '/handlare/oversikt' ||
    path === '/handlare/installningar' ||
    path === '/handlare/bilar' ||
    path === '/handlare/bilar/ny' ||
    path === '/handlare/lager' ||
    matchDealerCarDetail(path) !== null;

  const myCarToken = matchMyCar(path);
  if (myCarToken) {
    return (
      <Suspense fallback={<PageLoader />}>
        <MyCarPage token={myCarToken} onBack={() => navigate('/')} />
      </Suspense>
    );
  }

  const myQuoteToken = matchMyQuote(path);
  if (myQuoteToken) {
    return (
      <Suspense fallback={<PageLoader />}>
        <MyQuotePage token={myQuoteToken} onBack={() => navigate('/')} />
      </Suspense>
    );
  }

  if (path === '/portal') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PortalCallbackPage
          onSuccess={() => navigate('/mina-bilar')}
          onBack={() => navigate('/logga-in')}
        />
      </Suspense>
    );
  }

  if (onCustomerLogin) {
    if (authLoading) return <PageLoader />;
    if (session && sessionStorage.getItem('bilto_portal') === 'customer') {
      navigate('/mina-bilar');
      return null;
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <CustomerLogin onBack={() => navigate('/')} initialEmail={_initEmail} />
      </Suspense>
    );
  }

  if (onCustomerDashboard) {
    if (authLoading) return <PageLoader />;
    if (!session) { navigate('/logga-in'); return null; }
    return (
      <Suspense fallback={<PageLoader />}>
        <CustomerDashboard
          userId={session.user.id}
          onLoggedOut={() => { sessionStorage.removeItem('bilto_portal'); navigate('/logga-in'); }}
          onOpenCar={(token) => navigate(`/min-bil/${token}`)}
        />
      </Suspense>
    );
  }

  if (onDealerRegister) {
    return (
      <Suspense fallback={<PageLoader />}>
        <DealerRegister mode="landing" onBack={() => navigate('/')} onNavigateApply={() => navigate('/handlare/ansok')} />
      </Suspense>
    );
  }

  if (onDealerApply) {
    return (
      <Suspense fallback={<PageLoader />}>
        <DealerRegister mode="form" onBack={() => navigate('/handlare/registrera')} />
      </Suspense>
    );
  }

  if (onDealerLogin) {
    if (authLoading) return <PageLoader />;
    return (
      <Suspense fallback={<PageLoader />}>
        <DealerLogin
          onLoggedIn={() => navigate('/handlare/oversikt')}
          onNavigateRegister={() => navigate('/handlare/registrera')}
          onBack={() => navigate('/')}
        />
      </Suspense>
    );
  }

  if (onDealerApp) {
    if (authLoading) return <PageLoader />;
    if (!session) { navigate('/handlare/logga-in'); return null; }
    if (sessionStorage.getItem('bilto_portal') === 'customer') { navigate('/mina-bilar'); return null; }
    return (
      <Suspense fallback={<PageLoader />}>
        <DealerArea
          userId={session.user.id}
          path={path}
          onLoggedOut={() => { sessionStorage.removeItem('bilto_portal'); navigate('/handlare/logga-in'); }}
        />
      </Suspense>
    );
  }

  if (onAdminRoute) {
    if (authLoading) return <PageLoader />;
    if (!session) {
      return (
        <Suspense fallback={<PageLoader />}>
          <AdminLogin onLoggedIn={() => navigate('/admin/oversikt')} onBack={() => navigate('/')} />
        </Suspense>
      );
    }
    if (adminVerified === null) return <PageLoader />;
    if (adminVerified === false) {
      return (
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
          <div className="bg-white rounded-md shadow-sm border border-slate-200 p-8 max-w-md text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Ingen behörighet</h1>
            <p className="text-sm text-slate-500 mb-6">Ditt konto har inte administratörsrättigheter.</p>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate('/admin'); }}
              className="h-10 px-6 bg-black hover:bg-slate-800 text-white font-semibold text-sm rounded-full transition"
            >
              Logga ut
            </button>
          </div>
        </div>
      );
    }

    const adminNavigate = (page: import('./hooks/useAdminNav').AdminPage) => {
      if (page === 'overview') navigate('/admin/oversikt');
      else if (page === 'leads') navigate('/admin/leads');
      else if (page === 'handlare') navigate('/admin/handlare');
      else if (page === 'katalog') navigate('/admin/katalog');
    };

    return (
      <Suspense fallback={<PageLoader />}>
        <AdminRoutes
          path={path}
          setPath={setPath}
          session={session}
          adminNavigate={adminNavigate}
          navigate={navigate}
        />
      </Suspense>
    );
  }

  if (path === '/gratis-konsultation') {
    return (
      <Suspense fallback={<PageLoader />}>
        <FreeConsultationPage
          onBack={() => { window.history.pushState({}, '', '/'); setPath('/'); }}
          onNavigateBuy={() => { window.history.pushState({}, '', '/kop-bil-hjalp'); setPath('/kop-bil-hjalp'); }}
          onNavigateHowItWorks={() => { window.history.pushState({}, '', '/sa-funkar-det'); setPath('/sa-funkar-det'); }}
        />
      </Suspense>
    );
  }

  if (path === '/kop-bil-hjalp') {
    return (
      <Suspense fallback={<PageLoader />}>
        <KopBilConcierge
          onBack={() => { window.history.pushState({}, '', '/'); setPath('/'); }}
          onNavigateBuy={(bil) => {
            const params = new URLSearchParams();
            if (bil) params.set('bil', bil);
            params.set('source', 'Köp-hjälp-sida');
            window.history.pushState({}, '', `/kop-bil/bestall?${params.toString()}`);
            setPath('/kop-bil/bestall');
          }}
          onNavigateHowItWorks={() => { window.history.pushState({}, '', '/sa-funkar-det'); setPath('/sa-funkar-det'); }}
        />
      </Suspense>
    );
  }

  if (path === '/kop-bil/bestall') {
    const buyParams = new URLSearchParams(window.location.search);
    const buyBil = buyParams.get('bil') || '';
    const buyTyp = buyParams.get('typ');
    const buyReg = buyParams.get('reg') || '';
    const buySource = buyParams.get('source') || '';
    return (
      <Suspense fallback={<PageLoader />}>
        <BuyCarPage
          initialBil={buyBil}
          initialTyp={buyTyp === 'found' || buyTyp === 'searching' || buyTyp === 'trade' ? buyTyp : undefined}
          initialReg={buyReg}
          source={buySource}
          onBack={() => { window.history.pushState({}, '', '/kop-bil'); setPath('/kop-bil'); }}
        />
      </Suspense>
    );
  }

  if (path === '/kop-bil') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CompareCarsPage
          onBackHome={() => {
            window.history.pushState({}, '', '/');
            setPath('/');
            setPublicRoute({ page: 'home' });
          }}
          pageSlug="kop-bil"
        />
      </Suspense>
    );
  }

  if (path === '/utforska') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ExploreCarsPage
          onBackHome={() => {
            window.history.pushState({}, '', '/');
            setPath('/');
            setPublicRoute({ page: 'home' });
          }}
          onBuyCar={(make, model) => {
            const bil = encodeURIComponent(`${make} ${model}`);
            window.history.pushState({}, '', `/kop-bil/bestall?bil=${bil}&typ=found`);
            setPath('/kop-bil/bestall');
          }}
        />
      </Suspense>
    );
  }

  if (path === '/salj-bil-hjalp') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SaljBilMedHjalp
          onBackHome={() => {
            window.history.pushState({}, '', '/');
            setPath('/');
            setPublicRoute({ page: 'home' });
          }}
        />
      </Suspense>
    );
  }

  if (path === '/hitta-bil' || path === '/jamfor-bilar') {
    window.history.replaceState({}, '', '/kop-bil');
    setPath('/kop-bil');
    return null;
  }

  if (path === '/blogg' || path === '/blogg/salja-begagnad-bil') {
    return (
      <Suspense fallback={<PageLoader />}>
        <BlogPage
          onBackHome={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
        />
      </Suspense>
    );
  }

  if (path === '/om-oss') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AboutPage
          onBackHome={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
        />
      </Suspense>
    );
  }

  if (path === '/integritetspolicy') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PrivacyPage
          onBackHome={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
        />
      </Suspense>
    );
  }

  if (path === '/anvandarvillkor') {
    return (
      <Suspense fallback={<PageLoader />}>
        <TermsPage
          onBackHome={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
        />
      </Suspense>
    );
  }

  if (path === '/forhandling') {
    window.history.replaceState({}, '', '/kop-bil');
    setPath('/kop-bil');
    return null;
  }

  if (path === '/webbplatskarta') {
    return (
      <Suspense fallback={<PageLoader />}>
        <WebbplatskartaPage
          onBack={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
        />
      </Suspense>
    );
  }

  const cityMatch = path.match(/^\/salj-din-bil-i-([a-z0-9-]+)\/?$/);
  if (cityMatch) {
    const citySlug = cityMatch[1];
    const city = slugToCity(citySlug);
    return (
      <Suspense fallback={<PageLoader />}>
        <SeoLandingPage
          type="city"
          city={city}
          onSell={(reg) => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'sell', regnummer: reg }); }}
          onBack={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
        />
      </Suspense>
    );
  }

  const brandMatch = path.match(/^\/salj-din-([a-z0-9-]+)\/?$/);
  if (brandMatch && brandMatch[1] !== 'bil') {
    const brandSlug = brandMatch[1];
    const brand = slugToBrand(brandSlug);
    if (brand) {
      return (
        <Suspense fallback={<PageLoader />}>
          <SeoLandingPage
            type="brand"
            brand={brand}
            onSell={(reg) => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'sell', regnummer: reg }); }}
            onBack={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
          />
        </Suspense>
      );
    }
  }

  if (path === '/sa-funkar-det' || path === '/salj-din-bil') {
    return (
      <Suspense fallback={<PageLoader />}>
        {path === '/salj-din-bil' ? (
          <HowItWorks
            showSeo
            pageTitle="Sälj din bil | Bilto"
            onBackHome={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
            onSell={(reg) => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'sell', regnummer: reg }); }}
          />
        ) : (
          <SaFunkarDetPage
            onBackHome={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
            onSell={(reg, tel) => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'sell', regnummer: reg, telefon: tel }); }}
          />
        )}
      </Suspense>
    );
  }

  if (path === '/formedlingskalkylator' || path === '/formedla') {
    navigate('/');
    return null;
  }

  if (path === '/salj' && publicRoute.page !== 'sell') {
    navigate('/kop-bil');
    return null;
  }

  if (path === '/handlare') {
    navigate('/handlare/logga-in');
    return null;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <>
        {publicRoute.page === 'home' && (
          <HowItWorks
            onBackHome={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
            onSell={(reg) => setPublicRoute({ page: 'sell', regnummer: reg })}
          />
        )}
        {publicRoute.page === 'sell' && (
          <SellCarPage
            initialRegnummer={publicRoute.regnummer}
            initialTelefon={publicRoute.telefon}
            initialMiltal={publicRoute.miltal}
            onBack={() => { window.history.pushState({}, '', '/'); setPath('/'); setPublicRoute({ page: 'home' }); }}
            onNavigateTrade={(reg, mil) => {
              const params = new URLSearchParams({ typ: 'trade' });
              if (reg) params.set('reg', reg);
              if (mil) params.set('mil', mil.toString());
              window.history.pushState({}, '', `/kop-bil/bestall?${params.toString()}`);
              setPath('/kop-bil/bestall');
              setPublicRoute({ page: 'home' });
            }}
          />
        )}
      </>
    </Suspense>
  );
}

interface AdminRoutesProps {
  path: string;
  setPath: (p: string) => void;
  session: Session;
  adminNavigate: (page: import('./hooks/useAdminNav').AdminPage) => void;
  navigate: (path: string) => void;
}

function AdminRoutes({ path, setPath, session, adminNavigate }: AdminRoutesProps) {
  if (path === '/admin' || path === '/admin/oversikt') {
    return (
      <AdminOverview
        onLoggedOut={() => navigate('/admin')}
        onOpenCar={(id) => navigate(`/admin/bilar/${id}`)}
        onNavigate={adminNavigate}
      />
    );
  }

  if (path === '/admin/uppladdning') return <AdminBulkUpload onBack={() => navigate('/admin/bilar')} />;

  if (path === '/admin/bilar/ny') {
    return (
      <AdminAddCar
        adminUserId={session.user.id}
        adminName={session.user.email ?? 'Admin'}
        onBack={() => navigate('/admin/bilar')}
        onCreated={(id) => navigate(`/admin/bilar/${id}`)}
      />
    );
  }

  const proposalNewCarId = matchAdminProposalNew(path);
  if (proposalNewCarId) {
    return (
      <AdminDealerProposalEditor
        carId={proposalNewCarId}
        onBack={() => navigate(`/admin/bilar/${proposalNewCarId}`)}
        onLoggedOut={() => navigate('/admin')}
        onSent={() => navigate(`/admin/bilar/${proposalNewCarId}`)}
      />
    );
  }

  const carDetailId = matchAdminCarDetail(path);
  if (carDetailId) {
    return (
      <AdminCarDetail
        carId={carDetailId}
        onBack={() => navigate('/admin/bilar')}
        onLoggedOut={() => navigate('/admin')}
        onCreateProposal={(id) => navigate(`/admin/bilar/${id}/forslag/nytt`)}
      />
    );
  }

  const offerEditId = matchAdminOfferEdit(path);
  if (offerEditId) {
    return (
      <AdminOfferEditor
        offerId={offerEditId}
        onBack={() => navigate('/admin/forfragningar')}
        onSaved={() => navigate('/admin/forfragningar')}
      />
    );
  }

  const offerNewQuoteId = matchAdminOfferNew(path);
  if (offerNewQuoteId) {
    return (
      <AdminOfferEditor
        quoteRequestId={offerNewQuoteId}
        onBack={() => navigate(`/admin/forfragningar/${offerNewQuoteId}`)}
        onSaved={(id) => navigate(`/admin/erbjudanden/${id}`)}
      />
    );
  }

  const quoteDetailId = matchAdminQuoteDetail(path);
  if (quoteDetailId) {
    return (
      <AdminQuoteDetail
        quoteId={quoteDetailId}
        onBack={() => navigate('/admin/forfragningar')}
        onConvertToCar={async (data) => {
          await supabase
            .from('quote_requests')
            .update({ status: 'converted' })
            .eq('id', data.quoteId);
          window.history.pushState({ fromQuote: data }, '', '/admin/bilar/ny');
          setPath('/admin/bilar/ny');
        }}
        onCreateOffer={(quoteId) => navigate(`/admin/erbjudanden/nytt/${quoteId}`)}
      />
    );
  }

  if (path === '/admin/forfragningar') {
    navigate('/admin/leads');
    return null;
  }

  if (path === '/admin/leads') {
    return (
      <AdminLeadCommandCenter
        adminUserId={session.user.id}
        adminName={session.user.email ?? 'Admin'}
        onLoggedOut={() => navigate('/admin')}
        onOpenCar={(id) => navigate(`/admin/bilar/${id}`)}
        onOpenQuote={(id) => navigate(`/admin/forfragningar/${id}`)}
        onNavigate={adminNavigate}
      />
    );
  }

  if (path === '/admin/quiz') {
    return <AdminQuizSubmissions onLoggedOut={() => navigate('/admin')} onNavigate={adminNavigate} />;
  }

  const dealerDetailId = matchAdminDealerDetail(path);
  if (dealerDetailId) {
    return (
      <AdminDealerDetail
        dealerId={dealerDetailId}
        onBack={() => navigate('/admin/handlare')}
        onLoggedOut={() => navigate('/admin')}
      />
    );
  }

  if (path === '/admin/handlare') {
    return (
      <AdminDealers
        onLoggedOut={() => navigate('/admin')}
        onOpenDealer={(id) => navigate(`/admin/handlare/${id}`)}
        onNavigate={adminNavigate}
      />
    );
  }

  if (path === '/admin/katalog') {
    return (
      <AdminCarCatalog
        onBack={() => navigate('/admin/bilar')}
        onImport={() => navigate('/admin/katalog/importera')}
      />
    );
  }

  if (path === '/admin/katalog/importera') {
    return <AdminCatalogImport onBack={() => navigate('/admin/katalog')} />;
  }

  if (path !== '/admin/bilar') {
    navigate('/admin/bilar');
    return null;
  }

  return (
    <AdminCars
      onLoggedOut={() => navigate('/admin')}
      onOpenCar={(id) => navigate(`/admin/bilar/${id}`)}
      onAddCar={() => navigate('/admin/bilar/ny')}
      onNavigate={adminNavigate}
      onNavigateBulkUpload={() => navigate('/admin/uppladdning')}
      onNavigateCatalog={() => navigate('/admin/katalog')}
    />
  );
}

interface DealerAreaProps {
  userId: string;
  path: string;
  onLoggedOut: () => void;
}

function DealerArea({ userId, path, onLoggedOut }: DealerAreaProps) {
  const [loading, setLoading] = useState(true);
  const [dealer, setDealer] = useState<{
    id: string;
    foretagsnamn: string;
    godkand: boolean;
    isOwner: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: ownerData, error: ownerError } = await supabase
        .from('dealers')
        .select('id, foretagsnamn, godkand')
        .eq('user_id', userId)
        .maybeSingle();
      if (ownerError) { setError('Kunde inte hämta handlarprofil.'); setLoading(false); return; }
      if (ownerData) { setDealer({ ...ownerData, isOwner: true }); setLoading(false); return; }
      const { data: memberData, error: memberError } = await supabase
        .from('dealer_members')
        .select('dealer_id, dealers(id, foretagsnamn, godkand)')
        .eq('user_id', userId)
        .maybeSingle();
      if (memberError) { setError('Kunde inte hämta handlarprofil.'); setLoading(false); return; }
      if (memberData && memberData.dealers) {
        const d = memberData.dealers as { id: string; foretagsnamn: string; godkand: boolean };
        setDealer({ id: d.id, foretagsnamn: d.foretagsnamn, godkand: d.godkand, isOwner: false });
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <PageLoader />;

  if (error || !dealer) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-700 mb-6">{error ?? 'Ingen handlarprofil hittades för detta konto.'}</p>
          <button onClick={async () => { await supabase.auth.signOut(); onLoggedOut(); }} className="text-slate-600 hover:text-slate-900 font-medium">
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  if (!dealer.godkand) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Ditt konto väntar på godkännande</h1>
          <p className="text-slate-500 mb-6">Vi granskar din ansökan och hör av oss inom 24 timmar.</p>
          <button onClick={async () => { await supabase.auth.signOut(); onLoggedOut(); }} className="text-slate-600 hover:text-slate-900 font-medium">
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  if (path === '/handlare/lager') {
    return (
      <DealerInventorySync
        dealerId={dealer.id}
        foretagsnamn={dealer.foretagsnamn}
        onBack={() => navigate('/handlare/oversikt')}
        onLoggedOut={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
        onNavigateOverview={() => navigate('/handlare/oversikt')}
        onNavigateCars={() => navigate('/handlare/bilar')}
        onNavigateSettings={() => navigate('/handlare/installningar')}
      />
    );
  }

  if (path === '/handlare/installningar') {
    return (
      <DealerSettings
        dealerId={dealer.id}
        foretagsnamn={dealer.foretagsnamn}
        isOwner={dealer.isOwner}
        onBack={() => navigate('/handlare/oversikt')}
        onNavigateOverview={() => navigate('/handlare/oversikt')}
        onNavigateCars={() => navigate('/handlare/bilar')}
        onLogout={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
      />
    );
  }

  if (path === '/handlare/oversikt') {
    return (
      <DealerOverview
        dealerId={dealer.id}
        foretagsnamn={dealer.foretagsnamn}
        onLoggedOut={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
        onOpenCar={(id) => navigate(`/handlare/bilar/${id}`)}
        onAddCar={() => navigate('/handlare/bilar/ny')}
        onNavigateCars={() => navigate('/handlare/bilar')}
        onNavigateSettings={() => navigate('/handlare/installningar')}
        onNavigateInventory={() => navigate('/handlare/lager')}
      />
    );
  }

  if (path === '/handlare/bilar/ny') {
    return (
      <DealerAddCar
        dealerId={dealer.id}
        foretagsnamn={dealer.foretagsnamn}
        onBack={() => navigate('/handlare/bilar')}
        onCreated={() => navigate('/handlare/bilar')}
      />
    );
  }

  const carDetailId = matchDealerCarDetail(path);
  if (carDetailId) {
    return (
      <DealerCarDetail
        dealerId={dealer.id}
        foretagsnamn={dealer.foretagsnamn}
        carId={carDetailId}
        onBack={() => navigate('/handlare/bilar')}
        onLoggedOut={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
      />
    );
  }

  return (
    <DealerCarsList
      dealerId={dealer.id}
      foretagsnamn={dealer.foretagsnamn}
      onLoggedOut={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
      onOpenCar={(id) => navigate(`/handlare/bilar/${id}`)}
      onAddCar={() => navigate('/handlare/bilar/ny')}
      onNavigateOverview={() => navigate('/handlare/oversikt')}
      onNavigateSettings={() => navigate('/handlare/installningar')}
      onNavigateInventory={() => navigate('/handlare/lager')}
    />
  );
}

export default App;
