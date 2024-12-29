import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    walletBalance: 0,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('signIn', () => {
    it('should return access token when credentials are valid', async () => {
      const username = 'test@example.com';
      const password = 'password123';
      const token = 'jwt-token';

      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(token);

      const result = await service.signIn(username, password);

      expect(result).toEqual({ accessToken: token });
      expect(usersService.findOne).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.email,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(
        service.signIn('wrong@email.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('should create user and return access token', async () => {
      const email = 'new@example.com';
      const password = 'password123';
      const name = 'New User';
      const token = 'jwt-token';

      usersService.create.mockResolvedValue({
        ...mockUser,
        email,
        name,
      });
      jwtService.signAsync.mockResolvedValue(token);

      const result = await service.signUp(email, password, name);

      expect(result).toEqual({ accessToken: token });
      expect(usersService.create).toHaveBeenCalledWith({
        email,
        password,
        name,
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: email,
      });
    });

    it('should create user without name and return access token', async () => {
      const email = 'new@example.com';
      const password = 'password123';
      const token = 'jwt-token';

      usersService.create.mockResolvedValue({
        ...mockUser,
        email,
        name: null,
      });
      jwtService.signAsync.mockResolvedValue(token);

      const result = await service.signUp(email, password);

      expect(result).toEqual({ accessToken: token });
      expect(usersService.create).toHaveBeenCalledWith({
        email,
        password,
        name: undefined,
      });
    });
  });
});
