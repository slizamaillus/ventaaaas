import React from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { AppLayout } from './components/layout/AppLayout';
import { QuickCreateModal } from './components/modals/QuickCreateModal';
import { HomeModule } from './modules/HomeModule';
import { DashboardModule } from './modules/DashboardModule';
import { CompaniesModule } from './modules/CompaniesModule';
import { ContactsModule } from './modules/ContactsModule';
import { OpportunitiesModule } from './modules/OpportunitiesModule';
import { QuotesModule } from './modules/QuotesModule';
import { ProductsModule } from './modules/ProductsModule';
import { ActivitiesModule } from './modules/ActivitiesModule';
import { OrdersSalesAftersalesModule } from './modules/OrdersSalesAftersalesModule';
import { DocumentsModule } from './modules/DocumentsModule';
import { ReportsModule } from './modules/ReportsModule';
import { AutomationsModule } from './modules/AutomationsModule';
import { UsersModule } from './modules/UsersModule';
import { SettingsModule } from './modules/SettingsModule';
import { CustomizationModule } from './modules/CustomizationModule';
import { DesignSystemModule } from './modules/DesignSystemModule';

const ActiveModuleView: React.FC = () => {
  const { activeModule } = useCRM();

  switch (activeModule) {
    case 'inicio':
      return <HomeModule />;
    case 'dashboard':
      return <DashboardModule />;
    case 'empresas':
      return <CompaniesModule />;
    case 'contactos':
      return <ContactsModule />;
    case 'oportunidades':
      return <OpportunitiesModule />;
    case 'cotizaciones':
      return <QuotesModule />;
    case 'pedidos':
      return <OrdersSalesAftersalesModule section="pedidos" />;
    case 'ventas':
      return <OrdersSalesAftersalesModule section="ventas" />;
    case 'productos':
      return <ProductsModule />;
    case 'actividades':
      return <ActivitiesModule initialView="lista" />;
    case 'calendario':
      return <ActivitiesModule initialView="calendario" />;
    case 'tareas':
      return <ActivitiesModule initialView="pendientes" />;
    case 'postventa':
      return <OrdersSalesAftersalesModule section="postventa" />;
    case 'documentos':
      return <DocumentsModule />;
    case 'reportes':
      return <ReportsModule initialAnalytics={false} />;
    case 'analitica':
      return <ReportsModule initialAnalytics={true} />;
    case 'automatizaciones':
      return <AutomationsModule />;
    case 'usuarios':
      return <UsersModule />;
    case 'configuracion':
      return <SettingsModule />;
    case 'personalizacion':
      return <CustomizationModule />;
    case 'design-system':
      return <DesignSystemModule />;
    default:
      return <DashboardModule />;
  }
};

export default function App() {
  return (
    <CRMProvider>
      <AppLayout>
        <ActiveModuleView />
      </AppLayout>
      <QuickCreateModal />
    </CRMProvider>
  );
}
