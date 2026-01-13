import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { User } from '../src/entities/user.entity';
import { testDataSourceOptions } from './test-setup';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let validationPipe: ValidationPipe;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDataSourceOptions),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Включаем валидацию, так как она используется в контроллерах
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const registerDto = {
    username: 'e2euser',
    email: 'e2e@example.com',
    password: 'password123',
  };

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.username).toBe(registerDto.username);
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.password).toBeUndefined();
        });
    });

    it('should fail on duplicate username', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: registerDto.username,
          password: registerDto.password,
        })
        .expect(200) // AuthController.login возвращает 200
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('should fail with wrong credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: registerDto.username,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
  
  // Примечание: тесты запускаются последовательно, так что юзер уже зарегистрирован в первом тесте
});
