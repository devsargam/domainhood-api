import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('/health')
  healthCheck(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'Server is running',
    };
  }
}
