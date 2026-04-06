import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' }); // autorise tous les ports en développement
  await app.listen(process.env.PORT ?? 5000);
  console.log('Backend NestJS running on port 5000');
}
bootstrap();
