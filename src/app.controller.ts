import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user/user.service';
import { User as UserModel } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly userService: UserService) {}

  @Get('/health')
  healthCheck(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'Server is running',
    };
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
}
