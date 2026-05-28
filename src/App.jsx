import React, { useState, useEffect } from 'react';
import { RouteProvider, useRoute } from './context/RouteContext';
import AppShell from './components/layout/AppShell';
import TweaksPanel from './components/tweaks/TweaksPanel';
import { applyTheme } from './theme';

// Pages
import OverviewPage from './pages/OverviewPage';
import SuppliersPage from './pages/SuppliersPage';
import StatesPage from './pages/StatesPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import RatesPage from './pages/RatesPage';
import FreightPage from './pages/FreightPage';
import ReportsPage from './pages/ReportsPage';

const TWEAK_DEFAULTS = {
  accent: "indigo",
  chartStyle: "area",
  landing: "overview",
  dark: false,
  density: "comfortable",
};

function PageRouter({ tweaks }) {
  const { route } = useRoute();

  switch (route.name) {
    case "overview":
      return <OverviewPage tweaks={tweaks} />;
    case "suppliers":
      return <SuppliersPage tweaks={tweaks} />;
    case "supplier":
      return <SupplierDetailPage id={route.id} tweaks={tweaks} />;
    case "states":
      return <StatesPage tweaks={tweaks} />;
    case "rates":
      return <RatesPage tweaks={tweaks} />;
    case "freight":
      return <FreightPage tweaks={tweaks} />;
    case "reports":
      return <ReportsPage tweaks={tweaks} />;
    default:
      return <OverviewPage tweaks={tweaks} />;
  }
}

function AppInner() {
  const [tweaks, setTweaksState] = useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const setTweak = (key, value) => {
    setTweaksState(prev => ({ ...prev, [key]: value }));
  };

  // Apply theme whenever tweaks change
  useEffect(() => {
    applyTheme(tweaks);
  }, [tweaks]);

  // Apply initial theme on mount
  useEffect(() => {
    applyTheme(TWEAK_DEFAULTS);
  }, []);

  return (
    <>
      <AppShell onTweaksOpen={() => setTweaksOpen(o => !o)}>
        <PageRouter tweaks={tweaks} />
      </AppShell>

      <TweaksPanel
        open={tweaksOpen}
        onClose={() => setTweaksOpen(false)}
        tweaks={tweaks}
        setTweak={setTweak}
      />
    </>
  );
}

export default function App() {
  return (
    <RouteProvider initialRoute={{ name: "overview" }}>
      <AppInner />
    </RouteProvider>
  );
}
