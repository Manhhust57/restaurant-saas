import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.set('trust proxy', 1);

    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET must be configured in production');
    }

    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? true,
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('Restaurant SaaS API')
        .setDescription('Multi-tenant restaurant SaaS backend starter')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
    console.log(`API is running on: http://localhost:${port}`);
}

bootstrap();
