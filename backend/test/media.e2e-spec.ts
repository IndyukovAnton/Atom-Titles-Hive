import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { MediaModule } from '../src/modules/media/media.module';
import { testDataSourceOptions } from './test-setup';

describe('MediaModule (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDataSourceOptions),
        AuthModule,
        MediaModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Регистрация и логин для получения токена
    const registerDto = {
      username: 'mediauser',
      email: 'media@example.com',
      password: 'password123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  let createdMediaId: number;

  describe('/media (POST)', () => {
    it('should create media entry', () => {
      return request(app.getHttpServer())
        .post('/media')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My Movie',
          category: 'Фильм',
          rating: 8,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          createdMediaId = res.body.id;
          expect(res.body.title).toBe('My Movie');
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .post('/media')
        .send({ title: 'Fail' })
        .expect(401);
    });
  });

  describe('/media (GET)', () => {
    it('should return list of media', () => {
      return request(app.getHttpServer())
        .get('/media')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter by search', () => {
      return request(app.getHttpServer())
        .get('/media')
        .query({ search: 'Movie' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body[0].title).toContain('Movie');
        });
    });
  });

  describe('/media/:id (PATCH)', () => {
    it('should update media', () => {
      return request(app.getHttpServer())
        .patch(`/media/${createdMediaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 9 })
        .expect(200)
        .expect((res) => {
          expect(res.body.rating).toBe(9);
        });
    });
  });

  describe('/media/:id (DELETE)', () => {
    it('should delete media', () => {
      return request(app.getHttpServer())
        .delete(`/media/${createdMediaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should verify deletion', () => {
      return request(app.getHttpServer())
        .get(`/media/${createdMediaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
