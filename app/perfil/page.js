import PerfilPage from '@/components/perfil/PerfilPage';
import { Suspense } from 'react';

export default function Perfil() {
  return (
    <Suspense fallback={<div>Cargando perfil…</div>}>
      <PerfilPage />
    </Suspense>
  );
}
