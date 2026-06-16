import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { AdminPage } from './hooks/useAdminNav';
import type { BuyTrack } from './components/forms/BuyTrackStep';
import type { SeoCity, SeoBrand } from './lib/seo-pages';

import HomePage from './pages/HomePage';
import QuotePage from './pages/QuotePage';
import SellCarPage from './pages/SellCarPage';
import BuyCarPage from './pages/BuyCarPage';
import MyCarPage from './pages/MyCarPage';
import MyQuotePage from './pages/MyQuotePage';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerLogin from './pages/CustomerLogin';
import HowItWorks from './pages/HowItWorks';
import KopBilConcierge from './pages/KopBilConcierge';
import CompareCarsPage from './pages/CompareCarsPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import PortalCallbackPage from './pages/PortalCallbackPage';
import SetPasswordPage from './pages/SetPasswordPage';
import SeoLandingPage from './pages/SeoLandingPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import WebbplatskartaPage from './pages/WebbplatskartaPage';
import DealerRegister from './pages/DealerRegister';
import DealerLogin from './pages/DealerLogin';
import DealerOverview from './pages/DealerOverview';
import DealerCarsList from './pages/DealerCarsList';
import DealerCarDetail from './pages/DealerCarDetail';
import DealerAddCar from './pages/DealerAddCar';
import DealerSettings from './pages/DealerSettings';
import DealerInventorySync from './pages/DealerInventorySync';
import AdminLogin from './pages/AdminLogin';
import AdminOverview from './pages/AdminOverview';
import AdminCars from './pages/AdminCars';
import AdminCarDetail from './pages/AdminCarDetail';
import AdminAddCar from './pages/AdminAddCar';
import AdminQuoteRequests from './pages/AdminQuoteRequests';
import AdminQuoteDetail from './pages/AdminQuoteDetail';
import AdminDealers from './pages/AdminDealers';
import AdminDealerDetail from './pages/AdminDealerDetail';
import AdminLeadCommandCenter from './pages/AdminLeadCommandCenter';
import AdminQuizSubmissions from './pages/AdminQuizSubmissions';
import AdminOfferEditor from './pages/AdminOfferEditor';
import AdminDealerProposalEditor from './pages/AdminDealerProposalEditor';
import AdminBulkUpload from './pages/AdminBulkUpload';
import AdminCarCatalog from './pages/AdminCarCatalog';
import AdminCatalogImport from './pages/AdminCatalogImport';

type Screen =
  | { name: 'home' }
  | { name: 'quote'; regnummer: string; telefon: string }
  | { name: 'sell'; regnummer?: string; telefon?: string; miltal?: number }
  | { name: 'buy'; bil?: string; typ?: BuyTrack; reg?: string; source?: string }
  | { name: 'my-car'; token: string }
  | { name: 'my-quote'; token: string }
  | { name: 'customer-login'; initialEmail?: string }
  | { name: 'customer-dashboard'; userId: string }
  | { name: 'how-it-works' }
  | { name: 'kop-bil-concierge' }
  | { name: 'compare' }
  | { name: 'about' }
  | { name: 'blog' }
  | { name: 'portal-callback' }
  | { name: 'set-password' }
  | { name: 'seo-landing'; type: 'city' | 'brand'; city?: SeoCity; brand?: SeoBrand }
  | { name: 'privacy' }
  | { name: 'terms' }
  | { name: 'webbplatskarta' }
  | { name: 'dealer-register'; mode?: 'landing' | 'form' }
  | { name: 'dealer-login' }
  | { name: 'dealer-overview'; dealerId: string; foretagsnamn: string }
  | { name: 'dealer-cars'; dealerId: string; foretagsnamn: string }
  | { name: 'dealer-car-detail'; dealerId: string; foretagsnamn: string; carId: string }
  | { name: 'dealer-add-car'; dealerId: string; foretagsnamn: string }
  | { name: 'dealer-settings'; dealerId: string; foretagsnamn: string; isOwner: boolean }
  | { name: 'dealer-inventory'; dealerId: string; foretagsnamn: string }
  | { name: 'admin-login' }
  | { name: 'admin-overview'; adminUserId: string; adminName: string; adminPage: AdminPage }
  | { name: 'admin-car-detail'; adminUserId: string; adminName: string; carId: string }
  | { name: 'admin-add-car'; adminUserId: string; adminName: string }
  | { name: 'admin-quote-detail'; adminUserId: string; adminName: string; quoteId: string }
  | { name: 'admin-dealer-detail'; adminUserId: string; adminName: string; dealerId: string }
  | { name: 'admin-offer-editor'; adminUserId: string; adminName: string; offerId?: string; quoteRequestId?: string }
  | { name: 'admin-proposal-editor'; adminUserId: string; adminName: string; carId: string }
  | { name: 'admin-bulk-upload'; adminUserId: string; adminName: string }
  | { name: 'admin-catalog'; adminUserId: string; adminName: string }
  | { name: 'admin-catalog-import'; adminUserId: string; adminName: string };

function getInitialScreen(): Screen {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  if (path === '/sa-funkar-det') return { name: 'how-it-works' };
  if (path === '/kop-bil') return { name: 'kop-bil-concierge' };
  if (path === '/jamfor') return { name: 'compare' };
  if (path === '/om-oss') return { name: 'about' };
  if (path === '/blogg') return { name: 'blog' };
  if (path === '/integritetspolicy') return { name: 'privacy' };
  if (path === '/villkor') return { name: 'terms' };
  if (path === '/webbplatskarta') return { name: 'webbplatskarta' };
  if (path === '/logga-in') return { name: 'customer-login' };
  if (path === '/handlare') return { name: 'dealer-register', mode: 'landing' };
  if (path === '/handlare/registrera') return { name: 'dealer-register', mode: 'form' };
  if (path === '/handlare/logga-in') return { name: 'dealer-login' };
  if (path === '/admin') return { name: 'admin-login' };
  if (path.startsWith('/portal-callback')) return { name: 'portal-callback' };
  if (path.startsWith('/set-password')) return { name: 'set-password' };
  if (path.startsWith('/min-bil/')) {
    const token = path.replace('/min-bil/', '');
    if (token) return { name: 'my-car', token };
  }
  if (path.startsWith('/min-offert/')) {
    const token = path.replace('/min-offert/', '');
    if (token) return { name: 'my-quote', token };
  }
  if (path.startsWith('/salja/')) {
    const regnummer = params.get('reg') ?? undefined;
    return { name: 'sell', regnummer };
  }
  if (path === '/salja') {
    return { name: 'sell' };
  }

  const carToken = params.get('car');
  const quoteToken = params.get('quote');
  if (carToken) return { name: 'my-car', token: carToken };
  if (quoteToken) return { name: 'my-quote', token: quoteToken };

  return { name: 'home' };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen);

  useEffect(() => {
    window.history.pushState({}, '', '/');
  }, []);

  function goHome() {
    setScreen({ name: 'home' });
  }

  // ── PUBLIC PAGES ────────────────────────────────────────────────────────────

  if (screen.name === 'home') {
    return (
      <HomePage
        onNavigate={(regnummer, telefon) =>
          setScreen({ name: 'quote', regnummer, telefon })
        }
      />
    );
  }

  if (screen.name === 'quote') {
    return (
      <QuotePage
        onBackHome={goHome}
        onNavigateCalculator={() => setScreen({ name: 'sell', regnummer: screen.regnummer })}
        onNavigateHowItWorks={() => setScreen({ name: 'how-it-works' })}
      />
    );
  }

  if (screen.name === 'sell') {
    return (
      <SellCarPage
        initialRegnummer={screen.regnummer}
        initialTelefon={screen.telefon}
        initialMiltal={screen.miltal}
        onBack={goHome}
        onNavigateTrade={(regnummer, miltal) =>
          setScreen({ name: 'sell', regnummer, miltal })
        }
      />
    );
  }

  if (screen.name === 'buy') {
    return (
      <BuyCarPage
        initialBil={screen.bil}
        initialTyp={screen.typ}
        initialReg={screen.reg}
        source={screen.source}
        onBack={goHome}
      />
    );
  }

  if (screen.name === 'how-it-works') {
    return (
      <HowItWorks
        onBackHome={goHome}
        onQuickLead={(regnummer, telefon) =>
          setScreen({ name: 'quote', regnummer, telefon })
        }
        onSell={(regnummer) => setScreen({ name: 'sell', regnummer })}
      />
    );
  }

  if (screen.name === 'kop-bil-concierge') {
    return (
      <KopBilConcierge
        onBack={goHome}
        onNavigateBuy={(bil) => setScreen({ name: 'buy', bil })}
        onNavigateHowItWorks={() => setScreen({ name: 'how-it-works' })}
      />
    );
  }

  if (screen.name === 'compare') {
    return <CompareCarsPage onBackHome={goHome} />;
  }

  if (screen.name === 'about') {
    return <AboutPage onBackHome={goHome} />;
  }

  if (screen.name === 'blog') {
    return <BlogPage onBackHome={goHome} />;
  }

  if (screen.name === 'privacy') {
    return <PrivacyPage onBackHome={goHome} />;
  }

  if (screen.name === 'terms') {
    return <TermsPage onBackHome={goHome} />;
  }

  if (screen.name === 'webbplatskarta') {
    return <WebbplatskartaPage onBack={goHome} />;
  }

  if (screen.name === 'seo-landing') {
    return (
      <SeoLandingPage
        type={screen.type}
        city={screen.city}
        brand={screen.brand}
        onSell={(regnummer) => setScreen({ name: 'sell', regnummer })}
        onBack={goHome}
      />
    );
  }

  // ── AUTH / CUSTOMER ─────────────────────────────────────────────────────────

  if (screen.name === 'my-car') {
    return (
      <MyCarPage
        token={screen.token}
        onBack={goHome}
      />
    );
  }

  if (screen.name === 'my-quote') {
    return (
      <MyQuotePage
        token={screen.token}
        onBack={goHome}
      />
    );
  }

  if (screen.name === 'portal-callback') {
    return (
      <PortalCallbackPage
        onSuccess={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) setScreen({ name: 'customer-dashboard', userId: user.id });
          else goHome();
        }}
        onBack={goHome}
      />
    );
  }

  if (screen.name === 'set-password') {
    return (
      <SetPasswordPage
        onDone={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) setScreen({ name: 'customer-dashboard', userId: user.id });
          else goHome();
        }}
      />
    );
  }

  if (screen.name === 'customer-login') {
    return (
      <CustomerLogin
        initialEmail={screen.initialEmail}
        onBack={goHome}
      />
    );
  }

  if (screen.name === 'customer-dashboard') {
    return (
      <CustomerDashboard
        userId={screen.userId}
        onLoggedOut={goHome}
        onOpenCar={(token) => setScreen({ name: 'my-car', token })}
      />
    );
  }

  // ── DEALER PORTAL ───────────────────────────────────────────────────────────

  if (screen.name === 'dealer-register') {
    return (
      <DealerRegister
        onBack={goHome}
        mode={screen.mode ?? 'landing'}
        onNavigateApply={() => setScreen({ name: 'dealer-register', mode: 'form' })}
      />
    );
  }

  if (screen.name === 'dealer-login') {
    return (
      <DealerLogin
        onLoggedIn={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data: dealer } = await (supabase as any)
            .from('dealers')
            .select('id, foretagsnamn')
            .eq('user_id', user.id)
            .maybeSingle();
          if (dealer) {
            setScreen({
              name: 'dealer-overview',
              dealerId: dealer.id,
              foretagsnamn: dealer.foretagsnamn,
            });
          }
        }}
        onNavigateRegister={() => setScreen({ name: 'dealer-register', mode: 'form' })}
        onBack={goHome}
      />
    );
  }

  if (screen.name === 'dealer-overview') {
    return (
      <DealerOverview
        dealerId={screen.dealerId}
        foretagsnamn={screen.foretagsnamn}
        onLoggedOut={goHome}
        onOpenCar={(carId) =>
          setScreen({
            name: 'dealer-car-detail',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
            carId,
          })
        }
        onAddCar={() =>
          setScreen({
            name: 'dealer-add-car',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateCars={() =>
          setScreen({
            name: 'dealer-cars',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateSettings={() =>
          setScreen({
            name: 'dealer-settings',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
            isOwner: true,
          })
        }
        onNavigateInventory={() =>
          setScreen({
            name: 'dealer-inventory',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
      />
    );
  }

  if (screen.name === 'dealer-cars') {
    return (
      <DealerCarsList
        dealerId={screen.dealerId}
        foretagsnamn={screen.foretagsnamn}
        onLoggedOut={goHome}
        onOpenCar={(carId) =>
          setScreen({
            name: 'dealer-car-detail',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
            carId,
          })
        }
        onAddCar={() =>
          setScreen({
            name: 'dealer-add-car',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateOverview={() =>
          setScreen({
            name: 'dealer-overview',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateSettings={() =>
          setScreen({
            name: 'dealer-settings',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
            isOwner: true,
          })
        }
        onNavigateInventory={() =>
          setScreen({
            name: 'dealer-inventory',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
      />
    );
  }

  if (screen.name === 'dealer-car-detail') {
    return (
      <DealerCarDetail
        dealerId={screen.dealerId}
        foretagsnamn={screen.foretagsnamn}
        carId={screen.carId}
        onBack={() =>
          setScreen({
            name: 'dealer-cars',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onLoggedOut={goHome}
      />
    );
  }

  if (screen.name === 'dealer-add-car') {
    return (
      <DealerAddCar
        dealerId={screen.dealerId}
        foretagsnamn={screen.foretagsnamn}
        onBack={() =>
          setScreen({
            name: 'dealer-cars',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onCreated={(carId) =>
          setScreen({
            name: 'dealer-car-detail',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
            carId,
          })
        }
      />
    );
  }

  if (screen.name === 'dealer-settings') {
    return (
      <DealerSettings
        dealerId={screen.dealerId}
        foretagsnamn={screen.foretagsnamn}
        isOwner={screen.isOwner}
        onBack={() =>
          setScreen({
            name: 'dealer-overview',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateOverview={() =>
          setScreen({
            name: 'dealer-overview',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateCars={() =>
          setScreen({
            name: 'dealer-cars',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onLogout={goHome}
      />
    );
  }

  if (screen.name === 'dealer-inventory') {
    return (
      <DealerInventorySync
        dealerId={screen.dealerId}
        foretagsnamn={screen.foretagsnamn}
        onBack={() =>
          setScreen({
            name: 'dealer-overview',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onLoggedOut={goHome}
        onNavigateOverview={() =>
          setScreen({
            name: 'dealer-overview',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateCars={() =>
          setScreen({
            name: 'dealer-cars',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
          })
        }
        onNavigateSettings={() =>
          setScreen({
            name: 'dealer-settings',
            dealerId: screen.dealerId,
            foretagsnamn: screen.foretagsnamn,
            isOwner: true,
          })
        }
      />
    );
  }

  // ── ADMIN PORTAL ────────────────────────────────────────────────────────────

  if (screen.name === 'admin-login') {
    return (
      <AdminLogin
        onLoggedIn={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          setScreen({
            name: 'admin-overview',
            adminUserId: user.id,
            adminName: user.email ?? 'Admin',
            adminPage: 'overview',
          });
        }}
        onBack={goHome}
      />
    );
  }

  if (screen.name === 'admin-overview') {
    const { adminUserId, adminName, adminPage } = screen;
    if (adminPage === 'leads') {
      return (
        <AdminLeadCommandCenter
          adminUserId={adminUserId}
          adminName={adminName}
          onLoggedOut={goHome}
          onOpenCar={(carId) =>
            setScreen({ name: 'admin-car-detail', adminUserId, adminName, carId })
          }
          onOpenQuote={(quoteId) =>
            setScreen({ name: 'admin-quote-detail', adminUserId, adminName, quoteId })
          }
          onNavigate={(page) =>
            setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: page })
          }
        />
      );
    }
    if (adminPage === 'handlare') {
      return (
        <AdminDealers
          onLoggedOut={goHome}
          onOpenDealer={(dealerId) =>
            setScreen({ name: 'admin-dealer-detail', adminUserId, adminName, dealerId })
          }
          onNavigate={(page) =>
            setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: page })
          }
        />
      );
    }
    if (adminPage === 'katalog') {
      return (
        <AdminCarCatalog
          onBack={() =>
            setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'overview' })
          }
          onImport={() =>
            setScreen({ name: 'admin-catalog-import', adminUserId, adminName })
          }
        />
      );
    }
    return (
      <AdminOverview
        onLoggedOut={goHome}
        onOpenCar={(carId) =>
          setScreen({ name: 'admin-car-detail', adminUserId, adminName, carId })
        }
        onNavigate={(page) =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: page })
        }
      />
    );
  }

  if (screen.name === 'admin-car-detail') {
    const { adminUserId, adminName, carId } = screen;
    return (
      <AdminCarDetail
        carId={carId}
        onBack={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'overview' })
        }
        onLoggedOut={goHome}
        onCreateProposal={(cid) =>
          setScreen({ name: 'admin-proposal-editor', adminUserId, adminName, carId: cid })
        }
      />
    );
  }

  if (screen.name === 'admin-add-car') {
    const { adminUserId, adminName } = screen;
    return (
      <AdminAddCar
        adminUserId={adminUserId}
        adminName={adminName}
        onBack={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'overview' })
        }
        onCreated={(carId) =>
          setScreen({ name: 'admin-car-detail', adminUserId, adminName, carId })
        }
      />
    );
  }

  if (screen.name === 'admin-quote-detail') {
    const { adminUserId, adminName, quoteId } = screen;
    return (
      <AdminQuoteDetail
        quoteId={quoteId}
        onBack={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'leads' })
        }
        onConvertToCar={() =>
          setScreen({ name: 'admin-add-car', adminUserId, adminName })
        }
        onCreateOffer={(qid) =>
          setScreen({ name: 'admin-offer-editor', adminUserId, adminName, quoteRequestId: qid })
        }
      />
    );
  }

  if (screen.name === 'admin-dealer-detail') {
    const { adminUserId, adminName, dealerId } = screen;
    return (
      <AdminDealerDetail
        dealerId={dealerId}
        onBack={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'handlare' })
        }
        onLoggedOut={goHome}
      />
    );
  }

  if (screen.name === 'admin-offer-editor') {
    const { adminUserId, adminName, offerId, quoteRequestId } = screen;
    return (
      <AdminOfferEditor
        offerId={offerId}
        quoteRequestId={quoteRequestId}
        onBack={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'leads' })
        }
        onSaved={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'leads' })
        }
      />
    );
  }

  if (screen.name === 'admin-proposal-editor') {
    const { adminUserId, adminName, carId } = screen;
    return (
      <AdminDealerProposalEditor
        carId={carId}
        onBack={() =>
          setScreen({ name: 'admin-car-detail', adminUserId, adminName, carId })
        }
        onLoggedOut={goHome}
        onSent={() =>
          setScreen({ name: 'admin-car-detail', adminUserId, adminName, carId })
        }
      />
    );
  }

  if (screen.name === 'admin-bulk-upload') {
    const { adminUserId, adminName } = screen;
    return (
      <AdminBulkUpload
        onBack={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'overview' })
        }
      />
    );
  }

  if (screen.name === 'admin-catalog') {
    const { adminUserId, adminName } = screen;
    return (
      <AdminCarCatalog
        onBack={() =>
          setScreen({ name: 'admin-overview', adminUserId, adminName, adminPage: 'katalog' })
        }
        onImport={() =>
          setScreen({ name: 'admin-catalog-import', adminUserId, adminName })
        }
      />
    );
  }

  if (screen.name === 'admin-catalog-import') {
    const { adminUserId, adminName } = screen;
    return (
      <AdminCatalogImport
        onBack={() =>
          setScreen({ name: 'admin-catalog', adminUserId, adminName })
        }
      />
    );
  }

  return <HomePage onNavigate={(r, t) => setScreen({ name: 'quote', regnummer: r, telefon: t })} />;
}
