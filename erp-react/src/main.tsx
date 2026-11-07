import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/AppProviders';
import { App } from './App';
// Font e icone self-hosted (spec §13: nessun CDN esterno con la CSP finale).
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
// Il config del tenant va inizializzato prima del primo render: applica
// tema, titolo e lingua (vedi config/configStore.ts).
import './config/configStore';
import './styles/base.css';
import './styles/tokens.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppProviders>
            <App />
        </AppProviders>
    </StrictMode>
);
