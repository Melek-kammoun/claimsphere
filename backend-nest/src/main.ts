import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Backend NestJS running on port ${port}`);
}
bootstrap();
