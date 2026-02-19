import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- CONFIGURAZIONE BASIC AUTH ---
  // Prendi le credenziali dalle variabili d'ambiente (o usa fallback di default)
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'APP_USERNAME and APP_PASSWORD environment variables must be set for basic authentication',
    );
  }

  const users: Record<string, string> = {};
  users[username] = password;

  // Usa il middleware globalmente PRIMA di qualsiasi altra cosa
  app.use(
    basicAuth({
      users,
      challenge: true, // <-- Fondamentale: fa apparire il popup di login nel browser
      realm: 'ESN Manager Autenticazione', // Il testo mostrato nel popup
    }),
  );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error starting the server:', error);
  process.exit(1);
});
