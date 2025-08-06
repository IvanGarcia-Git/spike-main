# Plan de Despliegue a Producción - Spikes CRM/ERP en Vercel

## Resumen Ejecutivo

Este documento presenta un plan detallado para el despliegue a producción del sistema **Spikes CRM/ERP** utilizando **Vercel** como plataforma de hosting, optimizado para aplicaciones Next.js 14.

**Características del Sistema:**
- Frontend: Next.js 14 con App Router (optimizado para Vercel)
- Autenticación: JWT con cookies
- Base de datos: Migración de SQLite a Vercel Postgres
- API Backend: Separada o integrada con Next.js API Routes
- Despliegue: Vercel con integración Git automática

---

## Fase 1: Preparación de Cuenta y Proyecto en Vercel

### 1.1 Configuración de Cuenta Vercel
- [ ] **Crear cuenta Vercel**: Registrarse en [vercel.com](https://vercel.com)
- [ ] **Plan recomendado**: Pro Plan ($20/mes) para funciones avanzadas
- [ ] **Conectar repositorio Git**: GitHub, GitLab, o Bitbucket
- [ ] **Instalar Vercel CLI**: `npm i -g vercel`
- [ ] **Autenticación CLI**: `vercel login`

### 1.2 Configuración de Dominio
- [ ] **Dominio personalizado**: Configurar en Vercel Dashboard
- [ ] **DNS**: Apuntar dominios a Vercel nameservers
- [ ] **SSL automático**: Vercel maneja certificados automáticamente
- [ ] **Subdominio API**: Configurar para backend (api.tu-dominio.com)

---

## Fase 2: Configuración de Base de Datos con Vercel Postgres

### 2.1 Configuración de Vercel Postgres
**🚀 RECOMENDADO: Usar Vercel Postgres para integración optimizada**

#### Pasos de configuración:
1. [ ] **Crear base de datos Vercel Postgres**:
   - Acceder a Vercel Dashboard → Storage → Create Database
   - Seleccionar "Postgres" desde Vercel Marketplace
   - Elegir región (preferiblemente cercana a usuarios)
   
2. [ ] **Configuración inicial**:
   ```bash
   # Desde la interfaz de Vercel
   # Se generan automáticamente las variables:
   POSTGRES_URL
   POSTGRES_PRISMA_URL  
   POSTGRES_URL_NON_POOLING
   POSTGRES_USER
   POSTGRES_HOST
   POSTGRES_PASSWORD
   POSTGRES_DATABASE
   ```

3. [ ] **Migración de datos desde SQLite**:
   ```bash
   # Exportar datos actuales
   sqlite3 spikes.db .dump > spikes_data.sql
   
   # Convertir y limpiar SQL para PostgreSQL
   # Usar herramientas como pgloader o scripts personalizados
   
   # Importar a Vercel Postgres usando cliente web o CLI
   ```

### 2.2 Configuración Avanzada
- [ ] **Variables de entorno**: Auto-inyectadas por Vercel
- [ ] **Connection pooling**: Habilitado por defecto
- [ ] **Backups**: Automáticos en Vercel Postgres
- [ ] **Monitoring**: Dashboard integrado en Vercel
- [ ] **Escalabilidad**: Ajuste automático según plan

---

## Fase 3: Configuración del Backend API en Vercel

### 3.1 Opciones de Backend

#### Opción A: Next.js API Routes (Recomendado)
- [ ] **Migrar endpoints** a `/app/api/` routes
- [ ] **Aprovechar serverless functions** de Vercel
- [ ] **Configuración automática**: Sin setup adicional
- [ ] **Integración nativa**: Con base de datos Vercel

#### Opción B: Backend Separado en Vercel
- [ ] **Crear proyecto separado** para API
- [ ] **Desplegar backend** como aplicación independiente
- [ ] **Configurar subdominio**: api.tu-dominio.com
- [ ] **Variables de entorno**:
   ```env
   # Auto-generadas por Vercel Postgres
   POSTGRES_URL=postgresql://...
   JWT_SECRET=secure_jwt_secret_production
   NODE_ENV=production
   CORS_ORIGIN=https://tu-dominio.com
   ```

### 3.2 Configuración de Seguridad
- [ ] **Rate limiting**: Usar Vercel Edge Config o middleware
- [ ] **CORS**: Configurar en API routes o middleware
- [ ] **Edge Functions**: Para lógica de autenticación
- [ ] **Vercel Firewall**: Configurar reglas de acceso (Pro Plan)
- [ ] **Headers de seguridad**: 
   ```javascript
   // next.config.mjs
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: [
             {
               key: 'X-Frame-Options',
               value: 'DENY',
             },
             {
               key: 'X-Content-Type-Options',
               value: 'nosniff',
             },
             {
               key: 'Referrer-Policy',
               value: 'origin-when-cross-origin',
             },
           ],
         },
       ]
     },
   }
   ```

---

## Fase 4: Optimización del Frontend para Vercel

### 4.1 Configuración de Variables de Entorno
- [ ] **Configurar en Vercel Dashboard**:
   ```env
   # Production Environment
   NEXT_PUBLIC_API_URL=https://tu-dominio.com/api  # Para API Routes
   # O https://api.tu-dominio.com para backend separado
   NEXT_PUBLIC_URL_CONTRACT=https://tu-dominio.com
   JWT_SECRET=secure_jwt_secret_production
   NODE_ENV=production
   
   # Preview Environment
   NEXT_PUBLIC_API_URL=https://preview-branch.vercel.app/api
   
   # Development Environment
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```

### 4.2 Optimización de next.config.mjs para Vercel
- [ ] **Configuración optimizada**:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true, // Habilitar en producción
     poweredByHeader: false,
     compress: true,
     
     // Optimizaciones para Vercel
     experimental: {
       optimizeCss: true,
       optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
     },
     
     images: {
       remotePatterns: [
         {
           protocol: 'https',
           hostname: 'placehold.co',
         },
         {
           protocol: 'https',
           hostname: 'images.unsplash.com',
         },
       ],
       // Optimización de imágenes para Vercel
       formats: ['image/webp', 'image/avif'],
     },
     
     // Headers de seguridad
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: [
             {
               key: 'X-Frame-Options',
               value: 'DENY',
             },
             {
               key: 'X-Content-Type-Options',
               value: 'nosniff',
             },
             {
               key: 'Referrer-Policy',
               value: 'origin-when-cross-origin',
             },
           ],
         },
       ]
     },
   };
   
   export default nextConfig;
   ```

### 4.3 Preparación del Build
- [ ] **Limpiar configuración de desarrollo**:
   ```bash
   # Remover configuraciones específicas de desarrollo
   # Verificar que no hay rutas hardcodeadas a localhost
   ```
- [ ] **Verificar build local**:
   ```bash
   npm run build
   npm run start
   ```
- [ ] **Análisis de bundle**: Usar `@next/bundle-analyzer`
- [ ] **Optimización de imports**: Tree shaking y code splitting

---

## Fase 5: Despliegue en Vercel

### 5.1 Configuración del Proyecto en Vercel

#### Método 1: Desde el Dashboard (Recomendado)
- [ ] **Importar proyecto**:
  1. Ir a [vercel.com/dashboard](https://vercel.com/dashboard)
  2. Click "Add New..." → "Project"
  3. Importar desde Git provider (GitHub, GitLab, Bitbucket)
  4. Seleccionar repositorio `spikes-client`

- [ ] **Configuración del build**:
  ```javascript
  // Vercel detecta automáticamente Next.js
  Framework Preset: Next.js
  Build Command: npm run build (automático)
  Output Directory: .next (automático)
  Install Command: npm install (automático)
  Development Command: npm run dev
  ```

- [ ] **Variables de entorno**:
  - Configurar en Project Settings → Environment Variables
  - Añadir variables para Production, Preview, Development

#### Método 2: Desde CLI
- [ ] **Deploy inicial**:
   ```bash
   # Desde el directorio del proyecto
   vercel
   
   # Seguir el wizard:
   # ? Set up and deploy "~/spikes-client"? [Y/n] y
   # ? Which scope do you want to deploy to? [tu-usuario]
   # ? Link to existing project? [y/N] n
   # ? What's your project's name? spikes-client
   # ? In which directory is your code located? ./
   ```

- [ ] **Deploy de producción**:
   ```bash
   vercel --prod
   ```

### 5.2 Configuración Específica de Vercel

#### vercel.json (Opcional)
- [ ] **Crear configuración personalizada** si es necesario:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "framework": "nextjs",
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api/$1"
       }
     ],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options", 
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           }
         ]
       }
     ]
   }
   ```

### 5.3 Configuración de Dominios
- [ ] **Dominio personalizado**:
  1. Project Settings → Domains
  2. Add domain → "tu-dominio.com"
  3. Configure DNS records as shown
  4. Verify domain ownership

- [ ] **Subdominio para API** (si backend separado):
  1. Add domain → "api.tu-dominio.com"
  2. Point to separate API project

### 5.4 Configuración de Git Integration
- [ ] **Deployments automáticos**:
  - Production: Deploys from `main` branch
  - Preview: Deploys from any branch/PR
  - Development: Local development only

- [ ] **Branch protection**:
   ```bash
   # Configurar en GitHub/GitLab:
   # - Require PR reviews
   # - Require status checks (Vercel build)
   # - Restrict push to main branch
   ```

---

## Fase 6: Seguridad en Vercel

### 6.1 SSL/TLS Automático
- [ ] **Certificados SSL**: Automáticos con Vercel (Let's Encrypt)
- [ ] **HTTPS forzado**: Habilitado por defecto
- [ ] **HTTP/2**: Automático en todas las conexiones
- [ ] **Headers de seguridad**: Configurados en next.config.mjs

### 6.2 Vercel Security Features
- [ ] **Vercel Firewall** (Pro Plan):
  ```javascript
  // Configurar reglas en Dashboard
  // - Rate limiting por IP
  // - Geo-blocking si es necesario
  // - User-Agent filtering
  ```

- [ ] **DDoS Protection**: Incluido automáticamente
- [ ] **Bot Protection**: Vercel Bot Protection (Enterprise)
- [ ] **Web Application Firewall**: Disponible en planes Enterprise

### 6.3 Gestión de Secretos
- [ ] **Environment Variables**: Encriptadas en reposo en Vercel
- [ ] **JWT_SECRET**: Generar secreto fuerte (256-bit)
  ```bash
  # Generar secreto seguro
  openssl rand -base64 32
  ```
- [ ] **Vercel KV**: Para almacenamiento de sesiones (opcional)
- [ ] **Rotación de secretos**: Planificar rotación trimestral

### 6.4 Configuración de Seguridad Adicional
- [ ] **Content Security Policy**:
  ```javascript
  // En next.config.mjs
  const nextConfig = {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
            },
          ],
        },
      ]
    },
  }
  ```

- [ ] **Edge Middleware**: Para autenticación y rate limiting
  ```javascript
  // middleware.js optimizado para Edge Runtime
  import { NextResponse } from 'next/server'
  import { jwtVerify } from 'jose'

  export async function middleware(request) {
    // Lógica de autenticación optimizada para Edge
  }
  ```

---

## Fase 7: Monitoreo y Analytics con Vercel

### 7.1 Vercel Analytics y Monitoring
- [ ] **Vercel Analytics**: Habilitar en Project Settings
  ```javascript
  // app/layout.js
  import { Analytics } from '@vercel/analytics/react';
  
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    )
  }
  ```

- [ ] **Vercel Speed Insights**: Para métricas de rendimiento
  ```javascript
  import { SpeedInsights } from '@vercel/speed-insights/next';
  
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {children}
          <SpeedInsights />
        </body>
      </html>
    )
  }
  ```

### 7.2 Logging y Debugging
- [ ] **Vercel Function Logs**: Acceso desde Dashboard
- [ ] **Real-time logs**: 
  ```bash
  vercel logs --follow
  vercel logs [deployment-url]
  ```
- [ ] **Structured logging**:
  ```javascript
  // En API routes
  console.log(JSON.stringify({
    level: 'info',
    message: 'User logged in',
    userId: user.id,
    timestamp: new Date().toISOString()
  }));
  ```

### 7.3 Monitoreo Externo
- [ ] **Health Check Endpoint**:
  ```javascript
  // app/api/health/route.js
  export async function GET() {
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
  ```

- [ ] **Uptime Monitoring**: 
  - UptimeRobot (gratuito)
  - Pingdom
  - StatusCake
  
- [ ] **Error Tracking**: Integrar Sentry
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard -i nextjs
  ```

### 7.4 Métricas de Rendimiento
- [ ] **Core Web Vitals**: Monitoreo automático con Vercel
- [ ] **Database monitoring**: Si usa Vercel Postgres
- [ ] **Function execution time**: Visible en Vercel Dashboard
- [ ] **Bandwidth usage**: Tracking automático

---

## Fase 8: Backup y Recuperación en Vercel

### 8.1 Estrategia de Backup Automatizada
- [ ] **Base de datos Vercel Postgres**: 
  - Backups automáticos continuos (point-in-time recovery)
  - Retención hasta 7 días en plan Pro
  - Exportación manual disponible desde dashboard

- [ ] **Código fuente**: 
  - Git como fuente de verdad
  - Deployments inmutables en Vercel
  - Rollback instantáneo a cualquier deployment anterior

- [ ] **Archivos estáticos**:
  - Almacenados en Vercel Edge Network
  - CDN con múltiples réplicas globales
  - Backup adicional en repositorio Git

### 8.2 Recuperación de Desastres
- [ ] **RTO Vercel**: < 30 minutos (rollback automático)
- [ ] **RPO**: < 5 minutos (replicación continua)
- [ ] **Procedimientos de rollback**:
  ```bash
  # Rollback a deployment anterior
  vercel rollback [deployment-url]
  
  # O desde dashboard: Deployments → Promote to Production
  ```

### 8.3 Exportación de Datos
- [ ] **Backup manual de base de datos**:
  ```bash
  # Usando Vercel CLI
  vercel env pull .env.local
  
  # Conectar y exportar usando herramientas estándar
  pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Automatización con GitHub Actions**:
  ```yaml
  # .github/workflows/backup.yml
  name: Database Backup
  on:
    schedule:
      - cron: '0 2 * * *' # Daily at 2 AM
  jobs:
    backup:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - name: Backup Database
          env:
            POSTGRES_URL: ${{ secrets.POSTGRES_URL }}
          run: |
            pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d).sql
            # Upload to secure storage (S3, etc.)
  ```

---

## Fase 9: Pruebas Post-Despliegue en Vercel

### 9.1 Pruebas Automáticas con Preview Deployments
- [ ] **Preview URLs**: Probar en deployments de preview antes de producción
- [ ] **Branch testing**: Cada PR genera preview automático
- [ ] **Integration tests**:
  ```bash
  # Ejecutar tests contra preview URL
  NEXT_PUBLIC_API_URL=https://preview-abc123.vercel.app npm test
  ```

### 9.2 Pruebas Funcionales
- [ ] **Login/Logout**: Verificar autenticación JWT en producción
- [ ] **Navegación**: Probar todas las rutas principales
- [ ] **CRUD operations**: Contratos, leads, usuarios
- [ ] **Permisos**: Verificar roles (usuarios, managers, super admin)
- [ ] **Formularios**: Creación y edición de datos
- [ ] **Edge Cases**: Probar con diferentes ubicaciones geográficas

### 9.3 Pruebas de Rendimiento con Vercel
- [ ] **Core Web Vitals**: Verificar métricas en Vercel Speed Insights
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms  
  - CLS (Cumulative Layout Shift): < 0.1

- [ ] **Vercel Functions**: Verificar tiempos de ejecución < 10s
- [ ] **Edge Network**: Probar velocidad desde diferentes regiones
- [ ] **Lighthouse CI**:
  ```yaml
  # .github/workflows/lighthouse.yml
  - name: Lighthouse CI
    run: |
      npm install -g @lhci/cli
      lhci autorun --upload.target=temporary-public-storage
  ```

### 9.4 Pruebas de Seguridad
- [ ] **SSL Score**: Verificar A+ en SSL Labs
- [ ] **Headers de seguridad**: Verificar con securityheaders.com
- [ ] **CSP**: Comprobar Content Security Policy
- [ ] **Vercel Firewall**: Probar reglas de rate limiting (Pro Plan)
- [ ] **Authentication flow**: Verificar tokens, expiración, refresh

### 9.5 Monitoreo Post-Launch
- [ ] **Real User Monitoring**: Activar Vercel Analytics
- [ ] **Error tracking**: Configurar alertas en Sentry
- [ ] **Uptime monitoring**: Configurar checks externos
- [ ] **Database performance**: Monitorear queries lentas en Postgres

---

## Fase 10: Go-Live y Rollback en Vercel

### 10.1 Checklist Pre-Launch
- [ ] **DNS configurado**: Dominio apunta a Vercel
- [ ] **SSL automático**: Certificados activos y válidos
- [ ] **Environment variables**: Configuradas para producción
- [ ] **Database migrations**: Ejecutadas en Vercel Postgres
- [ ] **Preview testing**: Última versión probada en preview URL
- [ ] **Monitoring setup**: Analytics y Speed Insights activos

### 10.2 Proceso de Lanzamiento
- [ ] **Deployment a producción**:
  ```bash
  # Método 1: Merge a main branch (recomendado)
  git checkout main
  git merge feature-branch
  git push origin main
  
  # Método 2: Manual deploy
  vercel --prod
  ```

- [ ] **Promote deployment**:
  - Si se necesita promoción manual desde preview
  - Vercel Dashboard → Deployments → "Promote to Production"

- [ ] **Health check inmediato**:
  ```bash
  # Verificar endpoints críticos
  curl -f https://tu-dominio.com/api/health
  curl -f https://tu-dominio.com/
  ```

### 10.3 Plan de Rollback Instantáneo
- [ ] **Trigger conditions** para rollback:
  - Error rate > 5% en Vercel Analytics
  - Response time > 3 segundos promedio
  - Caída completa del servicio
  - Errores críticos en logs

- [ ] **Rollback procedure** (< 2 minutos):
  ```bash
  # Opción 1: Rollback automático desde CLI
  vercel rollback [previous-deployment-url]
  
  # Opción 2: Desde Vercel Dashboard
  # Deployments → Previous deployment → "Promote to Production"
  
  # Opción 3: Revert Git commit
  git revert [commit-hash]
  git push origin main  # Trigger new deployment
  ```

- [ ] **Database rollback** (si es necesario):
  ```bash
  # Point-in-time recovery disponible en Vercel Postgres
  # Desde Vercel Dashboard → Storage → Restore
  ```

### 10.4 Post-Launch Monitoring
- [ ] **Monitoreo intensivo**: Primeras 24 horas
  - Vercel Analytics dashboard abierto
  - Error tracking en tiempo real
  - Performance metrics

- [ ] **Communication plan**:
  - Slack/Teams channel para updates
  - Statuspage.io para comunicación externa
  - Email alerts configuradas

- [ ] **Success metrics**:
  - Response time < 1 segundo promedio
  - Error rate < 1%
  - Core Web Vitals en verde
  - 0 downtime durante launch

---

## Cronograma Estimado para Vercel

| Fase | Duración | Responsable | Dependencias |
|------|----------|-------------|--------------|
| Setup cuenta y dominio Vercel | 0.5 días | DevOps | - |
| Configuración Vercel Postgres | 0.5 días | Backend Dev | Cuenta Vercel |
| Migración API a Next.js routes | 2-3 días | Backend Dev | DB configurada |
| Optimización frontend | 1 día | Frontend Dev | - |
| Despliegue inicial preview | 0.5 días | DevOps | Código listo |
| Configuración seguridad | 0.5 días | DevOps | Deploy inicial |
| Pruebas preview/production | 1-2 días | QA Team | Deploy completo |
| Go-live | 0.5 días | Todos | Pruebas exitosas |

**Total estimado: 5-8 días hábiles**

### Ventajas del cronograma Vercel:
- ⚡ **50% más rápido** que infraestructura tradicional
- 🔄 **Deploy automático** con Git integration
- 🚀 **Zero-downtime** deployments
- 📊 **Monitoring integrado** desde día 1

---

## Costos Estimados Vercel (Mensual)

### Plan Hobby (Desarrollo/Testing)
- **Vercel Hobby**: $0/mes
- **Vercel Postgres**: $0/mes (limitado)
- **Dominio**: $12/año
- **Total**: $1/mes

### Plan Pro (Producción Pequeña/Mediana)
- **Vercel Pro**: $20/mes por miembro
- **Vercel Postgres**: $20/mes (1GB, 1 millón queries)
- **Bandwidth extra**: $0.40/GB (después de 1TB incluido)
- **Function executions**: Incluidas hasta 1 millón/mes
- **Dominio y SSL**: Incluido
- **Total**: $40-60/mes

### Plan Enterprise (Producción Grande)
- **Vercel Enterprise**: $400+/mes
- **Vercel Postgres**: $90+/mes (10GB+, queries ilimitadas)
- **Advanced Analytics**: Incluido
- **Priority Support**: Incluido
- **Team collaboration**: Ilimitado
- **Total**: $500-800/mes

### Comparación de Valor
| Característica | Infraestructura Tradicional | Vercel |
|----------------|----------------------------|--------|
| **Setup time** | 2-3 semanas | 1 día |
| **Mantenimiento** | 20-40h/mes | 0h/mes |
| **SSL/CDN** | $50-100/mes | Incluido |
| **Monitoring** | $100-200/mes | Incluido |
| **Escalabilidad** | Manual | Automática |
| **Rollback** | 30+ minutos | 30 segundos |

**💰 ROI**: Ahorro de 60-80% en costos totales de operación

---

## Contactos y Responsabilidades

| Rol | Responsabilidad | Contacto |
|-----|----------------|----------|
| Project Manager | Coordinación general | - |
| DevOps Engineer | Infraestructura y despliegue | - |
| Backend Developer | API y base de datos | - |
| Frontend Developer | Aplicación Next.js | - |
| QA Engineer | Pruebas y validación | - |

---

## Recursos y Enlaces Útiles

### Documentación Vercel
- [ ] **[Vercel Docs](https://vercel.com/docs)**: Documentación oficial
- [ ] **[Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)**: Guía específica
- [ ] **[Vercel CLI Reference](https://vercel.com/docs/cli)**: Comandos CLI
- [ ] **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)**: Base de datos

### Herramientas de Migración
- [ ] **[Database migration tools](https://www.npmjs.com/package/pgloader)**: SQLite a PostgreSQL
- [ ] **[Bundle analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)**: Optimización
- [ ] **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)**: Performance testing

### Checklist Final Pre-Launch
- [ ] **Código**: Pushed to main branch
- [ ] **Vercel project**: Configurado y conectado
- [ ] **Database**: Migrado y funcionando
- [ ] **Environment variables**: Configuradas
- [ ] **Custom domain**: DNS configurado
- [ ] **SSL certificates**: Activos
- [ ] **Monitoring**: Analytics habilitado
- [ ] **Backups**: Configuración verificada
- [ ] **Team access**: Permisos asignados

---

**Fecha de creación**: Enero 2025  
**Versión**: 2.0 - Vercel Optimized  
**Próxima revisión**: 30 días post go-live  
**Estimación total**: 5-8 días hábiles  
**Costo estimado**: $40-60/mes (Plan Pro)