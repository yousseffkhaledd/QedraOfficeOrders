"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors();
    // whitelist: strips fields not declared in the DTO; transform: turns JSON into DTO class instances
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port);
    console.log(`API running on http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map