import React, { useEffect } from 'react';
import { RouteProvider, useRoute } from './context/RouteContext';
import AppShell from './components/layout/AppShell';
import { applyTheme } from './theme';
import { ImportDataProvider } from './context/ImportDataContext';
import { FreightZonesProvider } from './context/FreightZonesContext';
import { DeletedSuppliersProvider } from './context/DeletedSuppliersContext';
import { SupplierDataProvider } from './context/SupplierDataContext';

// Pages
import OverviewPage from './pages/OverviewPage';
import SuppliersPage from './pages/SuppliersPage';
import StatesPage from './pages/StatesPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import RatesPage from './pages/RatesPage';
import FreightPage from './pages/FreightPage';
import ReportsPage from './pages/ReportsPage';
import SAPImportPage from './pages/SAPImportPage';

function PageRouter() {
  const { route } = useRoute();

  switch (route.name) {
    case "overview":
      return <OverviewPage />;
    case "suppliers":
      return <SuppliersPage />;
    case "supplier":
      return <SupplierDetailPage id={route.id} />;
    case "states":
      return <StatesPage />;
    case "rates":
      return <RatesPage />;
    case "freight":
      return <FreightPage />;
    case "reports":
      return <ReportsPage />;
    case "import":
      return <SAPImportPage />;
    default:
      return <OverviewPage />;
  }
}

function AppInner() {
  // Apply initial theme on mount
  useEffect(() => {
    applyTheme({ accent: "indigo", chartStyle: "area", dark: false, density: "comfortable" });
  }, []);

  return (
    <AppShell>
      <PageRouter />
    </AppShell>
  );
}

export default function App() {
  return (
    <ImportDataProvider>
      <FreightZonesProvider>
        <DeletedSuppliersProvider>
          <SupplierDataProvider>
            <RouteProvider initialRoute={{ name: "overview" }}>
              <AppInner />
            </RouteProvider>
          </SupplierDataProvider>
        </DeletedSuppliersProvider>
      </FreightZonesProvider>
    </ImportDataProvider>
  );
}
