import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*' });
  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Backend NestJS running on port ${port}`);
}
void bootstrap();
