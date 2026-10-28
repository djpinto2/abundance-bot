# ABUNDANCE Bot — WhatsApp Cloud API + Next.js

Bot de WhatsApp con menú de botones (Eventos / Clases / Hablar con Segundo).

## Estructura

```
app/api/webhook/route.ts   → recibe los mensajes de Meta (GET verifica, POST procesa)
lib/bot.ts                 → la lógica: qué responder a cada cosa
lib/whatsapp.ts            → funciones para enviar texto y botones
.env.example               → variables que tenés que completar
```

## Instalación

1. Creá un proyecto Next.js: `npx create-next-app@latest abundance-bot --ts --app`
2. Copiá las carpetas `app/api/webhook` y `lib` adentro del proyecto.
3. Copiá `.env.example` como `.env.local` y completá los valores.
4. Subilo a GitHub y deployalo en Vercel (cargá las mismas variables en Settings → Environment Variables).

## Configuración en Meta

1. developers.facebook.com → My Apps → Create App → caso de uso "Conectarse con clientes por WhatsApp".
2. Elegí tu Business Portfolio (Abundance productions).
3. WhatsApp → API Setup: copiá el **token temporal** y el **Phone number ID** del número de prueba.
4. En "To", agregá tu número personal (te llega un código para verificarlo).
5. WhatsApp → Configuration → Webhook:
   - Callback URL: `https://TU-PROYECTO.vercel.app/api/webhook`
   - Verify token: el mismo que pusiste en `WEBHOOK_VERIFY_TOKEN`
   - Verify and Save → Manage → suscribite al campo **messages**.
6. Mandale "hola" al número de prueba desde tu WhatsApp. Tiene que responder con el menú.

## Para pasar a producción

- Token permanente: Business Settings → System Users → crear usuario de sistema → generar token con permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
- Agregar tu número real en WhatsApp → API Setup → Add phone number.
- Verificar el negocio en Meta Business si te lo pide.

## Reglas importantes de WhatsApp

- Podés responder libremente durante **24 h** desde el último mensaje del cliente.
- Para escribirle primero a alguien (o pasadas las 24 h) necesitás una **plantilla aprobada** por Meta.
