import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: { user: { findUnique: jest.Mock; create: jest.Mock } };

  const mockUser: User = {
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
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return undefined if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent@example.com');

      expect(result).toBeUndefined();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    });

    it('should create a new user successfully', async () => {
      const createdUser = {
        ...mockUser,
        email: createUserDto.email,
        name: createUserDto.name,
      };

      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          password: 'hashedPassword',
          name: createUserDto.name,
        },
      });
    });

    it('should create a user without name', async () => {
      const createUserDtoWithoutName = {
        email: 'new@example.com',
        password: 'password123',
      };

      const createdUser = {
        ...mockUser,
        email: createUserDtoWithoutName.email,
        name: null,
      };

      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDtoWithoutName);

      expect(result).toEqual(createdUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDtoWithoutName.email,
          password: 'hashedPassword',
          name: undefined,
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const prismaError = new PrismaClientKnownRequestError('', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      prismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
    });

    it('should throw ConflictException on other database errors', async () => {
      prismaService.user.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Failed to create user'),
      );
    });
  });
});
