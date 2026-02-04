import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix("api");

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Id"],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle("SmartFlux ERP API")
    .setDescription("API completa do sistema SmartFlux ERP")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Autenticação")
    .addTag("users", "Usuários")
    .addTag("products", "Produtos")
    .addTag("categories", "Categorias")
    .addTag("customers", "Clientes")
    .addTag("sales", "Vendas / PDV")
    .addTag("service-orders", "Ordens de Serviço")
    .addTag("financial", "Financeiro")
    .addTag("invoices", "Notas Fiscais")
    .addTag("notifications", "Notificações")
    .addTag("dashboard", "Dashboard")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🚀 SmartFlux ERP Backend is running!               ║
  ║                                                       ║
  ║   📍 Server:    http://localhost:${port}               ║
  ║   📚 API Docs:  http://localhost:${port}/api/docs      ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
