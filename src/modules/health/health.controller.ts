import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Simple liveness endpoint.' })
  check() {
    return {
      status: 'ok',
      service: 'comanda-flow-api',
      timestamp: new Date().toISOString(),
    };
  }
}
