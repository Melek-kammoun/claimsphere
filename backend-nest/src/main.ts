import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*' }); // autorise tous les ports en developpement
  await app.listen(process.env.PORT ?? 5000);
  console.log('Backend NestJS running on port 5000');
  app.useGlobalPipes(new ValidationPipe());
}
bootstrap();
