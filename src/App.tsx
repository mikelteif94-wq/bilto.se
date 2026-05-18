import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import QuotePage from './pages/QuotePage';
import BrokerageCalculator from './pages/BrokerageCalculator';
import HowItWorks from './pages/HowItWorks';
import SellCarPage from './pages/SellCarPage';
import BuyCarPage from './pages/BuyCarPage';
import DealerRegister from './pages/DealerRegister';
import DealerLogin from './pages/DealerLogin';
import DealerCarsList from './pages/DealerCarsList';
import DealerOverview from './pages/DealerOverview';
import DealerCarDetail from './pages/DealerCarDetail';
import DealerAddCar from './pages/DealerAddCar';
import DealerSettings from './pages/DealerSettings';
import AdminLogin from './pages/AdminLogin';
import AdminOverview from './pages/AdminOverview';
import AdminCars from './pages/AdminCars';
import AdminCarDetail from './pages/AdminCarDetail';
import AdminAddCar from './pages/AdminAddCar';
import AdminDealers from './pages/AdminDealers';
import AdminDealerDetail from './pages/AdminDealerDetail';
import AdminQuoteRequests from './pages/AdminQuoteRequests';
import AdminQuoteDetail from './pages/AdminQuoteDetail';
import AdminOfferEditor from './pages/AdminOfferEditor';
import AdminBulkUpload from './pages/AdminBulkUpload';
import AdminQuizSubmissions from './pages/AdminQuizSubmissions';
import MyCarPage from './pages/MyCarPage';
import MyQuotePage from './pages/MyQuotePage';
import SetPasswordPage from './pages/SetPasswordPage';
import CustomerLogin from './pages/CustomerLogin';
import CustomerDashboard from './pages/CustomerDashboard';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import BlogPage from './pages/BlogPage';
import AboutPage from './pages/AboutPage';
import CompareCarsPage from './pages/CompareCarsPage';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

type PublicRoute =
  | { page: 'home' }
  | { page: 'brokerage' }
  | { page: 'sell'; regnummer: string; telefon?: string; miltal?: number; salesType?: 'auction' | 'brokerage' }
;

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
  return false;
}

function App() {
  const [publicRoute, setPublicRoute] = useState<PublicRoute>({ page: 'home' });
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState<boolean>(detectRecovery());
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
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        if (window.location.pathname !== '/handlare/valj-losenord') {
          window.history.replaceState({}, '', '/handlare/valj-losenord');
          setPath('/handlare/valj-losenord');
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !path.startsWith('/admin')) {
      setAdminVerified(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setAdminVerified(!!data);
      });
    return () => { cancelled = true; };
  }, [session?.user?.id, path.startsWith('/admin')]);

  if (recoveryMode) {
    return (
      <SetPasswordPage
        onDone={() => {
          setRecoveryMode(false);
          navigate('/handlare/oversikt');
        }}
      />
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
    matchDealerCarDetail(path) !== null;

  const myCarToken = matchMyCar(path);
  if (myCarToken) {
    return <MyCarPage token={myCarToken} onBack={() => navigate('/')} />;
  }

  const myQuoteToken = matchMyQuote(path);
  if (myQuoteToken) {
    return <MyQuotePage token={myQuoteToken} onBack={() => navigate('/')} />;
  }

  if (onCustomerLogin) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }
    if (session) {
      navigate('/mina-bilar');
      return null;
    }
    return (
      <CustomerLogin
        onLoggedIn={() => navigate('/mina-bilar')}
        onBack={() => navigate('/')}
      />
    );
  }

  if (onCustomerDashboard) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }
    if (!session) {
      navigate('/logga-in');
      return null;
    }
    return (
      <CustomerDashboard
        userId={session.user.id}
        onLoggedOut={() => navigate('/logga-in')}
        onOpenCar={(token) => navigate(`/min-bil/${token}`)}
      />
    );
  }

  if (onDealerRegister) {
    return (
      <DealerRegister
        mode="landing"
        onBack={() => { navigate('/'); }}
        onNavigateApply={() => navigate('/handlare/ansok')}
      />
    );
  }

  if (onDealerApply) {
    return (
      <DealerRegister
        mode="form"
        onBack={() => { navigate('/handlare/registrera'); }}
      />
    );
  }

  if (onDealerLogin) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }
    return (
      <DealerLogin
        onLoggedIn={() => navigate('/handlare/oversikt')}
        onNavigateRegister={() => navigate('/handlare/registrera')}
        onBack={() => navigate('/')}
      />
    );
  }

  if (onDealerApp) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }
    if (!session) {
      navigate('/handlare/logga-in');
      return null;
    }
    return (
      <DealerArea
        userId={session.user.id}
        path={path}
        onLoggedOut={() => navigate('/handlare/logga-in')}
      />
    );
  }

  if (onAdminRoute) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }

    if (!session) {
      return <AdminLogin onLoggedIn={() => navigate('/admin/oversikt')} />;
    }

    if (adminVerified === null) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }

    if (adminVerified === false) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
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

    if (path === '/admin' || path === '/admin/oversikt') {
      return (
        <AdminOverview
          onLoggedOut={() => navigate('/admin')}
          onOpenCar={(id) => navigate(`/admin/bilar/${id}`)}
          onNavigateCars={() => navigate('/admin/bilar')}
          onNavigateDealers={() => navigate('/admin/handlare')}
          onNavigateQuotes={() => navigate('/admin/forfragningar')}
          onNavigateQuiz={() => navigate('/admin/quiz')}
        />
      );
    }

    if (path === '/admin/uppladdning') {
      return <AdminBulkUpload onBack={() => navigate('/admin/bilar')} />;
    }

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

    const carDetailId = matchAdminCarDetail(path);
    if (carDetailId) {
      return (
        <AdminCarDetail
          carId={carDetailId}
          onBack={() => navigate('/admin/bilar')}
          onLoggedOut={() => navigate('/admin')}
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
            window.history.pushState(
              { fromQuote: data },
              '',
              '/admin/bilar/ny'
            );
            setPath('/admin/bilar/ny');
          }}
          onCreateOffer={(quoteId) => navigate(`/admin/erbjudanden/nytt/${quoteId}`)}
        />
      );
    }

    if (path === '/admin/forfragningar') {
      return (
        <AdminQuoteRequests
          onLoggedOut={() => navigate('/admin')}
          onOpenQuote={(id) => navigate(`/admin/forfragningar/${id}`)}
          onNavigateCars={() => navigate('/admin/bilar')}
          onNavigateDealers={() => navigate('/admin/handlare')}
          onNavigateOverview={() => navigate('/admin/oversikt')}
        />
      );
    }

    if (path === '/admin/quiz') {
      return (
        <AdminQuizSubmissions
          onLoggedOut={() => navigate('/admin')}
          onNavigateCars={() => navigate('/admin/bilar')}
          onNavigateDealers={() => navigate('/admin/handlare')}
          onNavigateOverview={() => navigate('/admin/oversikt')}
          onNavigateQuotes={() => navigate('/admin/forfragningar')}
        />
      );
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
          onNavigateCars={() => navigate('/admin/bilar')}
          onNavigateOverview={() => navigate('/admin/oversikt')}
        />
      );
    }

    if (path !== '/admin/bilar') {
      navigate('/admin/bilar');
      return null;
    }

    return (
      <AdminCars
        onLoggedOut={() => navigate('/admin')}
        onOpenCar={(id) => navigate(`/admin/bilar/${id}`)}
        onNavigateDealers={() => navigate('/admin/handlare')}
        onAddCar={() => navigate('/admin/bilar/ny')}
        onNavigateOverview={() => navigate('/admin/oversikt')}
        onNavigateQuotes={() => navigate('/admin/forfragningar')}
        onNavigateBulkUpload={() => navigate('/admin/uppladdning')}
      />
    );
  }

  if (path === '/kop-bil') {
    const buyParams = new URLSearchParams(window.location.search);
    const buyBil = buyParams.get('bil') || '';
    const buyTyp = buyParams.get('typ');
    const buyReg = buyParams.get('reg') || '';
    const buySource = buyParams.get('source') || '';
    return (
      <BuyCarPage
        initialBil={buyBil}
        initialTyp={buyTyp === 'found' || buyTyp === 'searching' || buyTyp === 'trade' ? buyTyp : undefined}
        initialReg={buyReg}
        source={buySource}
        onBack={() => {
          window.history.pushState({}, '', '/forhandling');
          setPath('/forhandling');
        }}
      />
    );
  }

  if (path === '/hitta-bil') {
    window.history.replaceState({}, '', '/jamfor-bilar');
    setPath('/jamfor-bilar');
    return null;
  }

  if (path === '/jamfor-bilar') {
    return (
      <CompareCarsPage
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
      />
    );
  }

  if (path === '/blogg' || path === '/blogg/salja-begagnad-bil') {
    return (
      <BlogPage
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
      />
    );
  }

  if (path === '/om-oss') {
    return (
      <AboutPage
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
      />
    );
  }

  if (path === '/integritetspolicy') {
    return (
      <PrivacyPage
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
      />
    );
  }

  if (path === '/anvandarvillkor') {
    return (
      <TermsPage
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
      />
    );
  }

  if (path === '/forhandling') {
    return (
      <QuotePage
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
        onNavigateCalculator={() => {
          window.history.pushState({}, '', '/formedlingskalkylator');
          setPath('/formedlingskalkylator');
        }}
        onNavigateHowItWorks={() => {
          window.history.pushState({}, '', '/sa-funkar-det');
          setPath('/sa-funkar-det');
        }}
      />
    );
  }

  if (path === '/sa-funkar-det' || path === '/salj-din-bil') {
    return (
      <HowItWorks
        showSeo={path === '/salj-din-bil'}
        pageTitle={path === '/salj-din-bil' ? 'Sälj din bil | Bilto' : undefined}
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
        onStartBrokerage={(regnummer, miltal) => {
          if (regnummer) {
            setPublicRoute({
              page: 'sell',
              regnummer,
              miltal: miltal ?? 0,
              salesType: 'brokerage',
            });
            window.history.pushState({}, '', '/salj');
            setPath('/salj');
          } else {
            window.history.pushState({}, '', '/formedla');
            setPath('/formedla');
          }
        }}
      />
    );
  }

  if (path === '/formedlingskalkylator') {
    return (
      <BrokerageCalculator
        onBackHome={() => {
          window.history.pushState({}, '', '/');
          setPath('/');
          setPublicRoute({ page: 'home' });
        }}
        onStartBrokerage={(regnummer) => {
          setPublicRoute({
            page: 'sell',
            regnummer: regnummer ?? '',
            miltal: 0,
            salesType: 'brokerage',
          });
          window.history.pushState({}, '', '/salj');
          setPath('/salj');
        }}
      />
    );
  }

  if (path === '/formedla') {
    navigate('/forhandling');
    return null;
  }

  if (path === '/salj' && publicRoute.page !== 'sell') {
    navigate('/forhandling');
    return null;
  }

  if (path === '/handlare') {
    navigate('/handlare/logga-in');
    return null;
  }

  return (
    <>
      {publicRoute.page === 'home' && (
        <HowItWorks
          onBackHome={() => {
            window.history.pushState({}, '', '/');
            setPath('/');
            setPublicRoute({ page: 'home' });
          }}
          onStartBrokerage={(regnummer, miltal) => {
            if (regnummer) {
              setPublicRoute({
                page: 'sell',
                regnummer,
                miltal: miltal ?? 0,
                salesType: 'brokerage',
              });
              window.history.pushState({}, '', '/salj');
              setPath('/salj');
            } else {
              window.history.pushState({}, '', '/formedla');
              setPath('/formedla');
            }
          }}
        />
      )}
      {publicRoute.page === 'sell' && (
        <SellCarPage
          initialRegnummer={publicRoute.regnummer}
          initialTelefon={publicRoute.telefon}
          initialMiltal={publicRoute.miltal}
          salesType={publicRoute.salesType}
          onBack={() => {
            window.history.pushState({}, '', '/');
            setPath('/');
            setPublicRoute({ page: 'home' });
          }}
          onNavigateTrade={(reg, mil) => {
            const params = new URLSearchParams({ typ: 'trade' });
            if (reg) params.set('reg', reg);
            if (mil) params.set('mil', mil.toString());
            window.history.pushState({}, '', `/forhandling?${params.toString()}`);
            setPath('/forhandling');
            setPublicRoute({ page: 'home' });
          }}
        />
      )}
    </>
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
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('dealers')
        .select('id, foretagsnamn, godkand')
        .eq('user_id', userId)
        .maybeSingle();
      if (fetchError) {
        setError('Kunde inte hämta handlarprofil.');
      } else {
        setDealer(data);
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !dealer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-700 mb-6">
            {error ?? 'Ingen handlarprofil hittades för detta konto.'}
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              onLoggedOut();
            }}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  if (!dealer.godkand) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Ditt konto väntar på godkännande
          </h1>
          <p className="text-slate-500 mb-6">
            Vi granskar din ansökan och hör av oss inom 24 timmar.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              onLoggedOut();
            }}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  if (path === '/handlare/installningar') {
    return (
      <DealerSettings
        dealerId={dealer.id}
        onBack={() => navigate('/handlare/oversikt')}
      />
    );
  }

  if (path === '/handlare/oversikt') {
    return (
      <DealerOverview
        dealerId={dealer.id}
        foretagsnamn={dealer.foretagsnamn}
        onLoggedOut={async () => {
          await supabase.auth.signOut();
          onLoggedOut();
        }}
        onOpenCar={(id) => navigate(`/handlare/bilar/${id}`)}
        onAddCar={() => navigate('/handlare/bilar/ny')}
        onNavigateCars={() => navigate('/handlare/bilar')}
        onNavigateSettings={() => navigate('/handlare/installningar')}
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
        onLoggedOut={async () => {
          await supabase.auth.signOut();
          onLoggedOut();
        }}
      />
    );
  }

  return (
    <DealerCarsList
      dealerId={dealer.id}
      foretagsnamn={dealer.foretagsnamn}
      onLoggedOut={async () => {
        await supabase.auth.signOut();
        onLoggedOut();
      }}
      onOpenCar={(id) => navigate(`/handlare/bilar/${id}`)}
      onAddCar={() => navigate('/handlare/bilar/ny')}
      onNavigateOverview={() => navigate('/handlare/oversikt')}
      onNavigateSettings={() => navigate('/handlare/installningar')}
    />
  );
}

export default App;
