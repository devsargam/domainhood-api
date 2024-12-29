import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from './auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      signIn: jest.fn(),
      signUp: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockUsersService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access token on successful sign in', async () => {
      const signInDto = {
        username: 'test@example.com',
        password: 'password123',
      };
      const expectedResponse = { accessToken: 'jwt-token' };

      authService.signIn.mockResolvedValue(expectedResponse);

      const result = await controller.signIn(signInDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.signIn).toHaveBeenCalledWith(
        signInDto.username,
        signInDto.password,
      );
    });
  });

  describe('signUp', () => {
    it('should return access token on successful sign up', async () => {
      const signUpDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };
      const expectedResponse = { accessToken: 'jwt-token' };

      authService.signUp.mockResolvedValue(expectedResponse);

      const result = await controller.signUp(signUpDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.signUp).toHaveBeenCalledWith(
        signUpDto.email,
        signUpDto.password,
        signUpDto.name,
      );
    });

    it('should handle sign up without name', async () => {
      const signUpDto = {
        email: 'new@example.com',
        password: 'password123',
      };
      const expectedResponse = { accessToken: 'jwt-token' };

      authService.signUp.mockResolvedValue(expectedResponse);

      const result = await controller.signUp(signUpDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.signUp).toHaveBeenCalledWith(
        signUpDto.email,
        signUpDto.password,
        undefined,
      );
    });
  });
});
