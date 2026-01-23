import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { GroupsModule } from '../src/modules/groups/groups.module';
import { MediaModule } from '../src/modules/media/media.module'; // Чтобы проверить создание медиа в группе
import { testDataSourceOptions } from './test-setup';

describe('GroupsModule (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDataSourceOptions),
        AuthModule,
        GroupsModule,
        MediaModule, // нужен для связывания
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Register & Login
    const registerDto = {
      username: 'groupsuser',
      email: 'groups@example.com',
      password: 'password123',
    };

    const response = await request(app.getHttpServer() as string)
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    authToken = (response.body as { access_token: string }).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  let createdGroupId: number;

  describe('/groups (POST)', () => {
    it('should create a group', () => {
      return request(app.getHttpServer() as string)
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'My Group' })
        .expect(201)
        .expect((res: request.Response) => {
          const body = res.body as { id: number; name: string };
          expect(body.id).toBeDefined();
          createdGroupId = body.id;
          expect(body.name).toBe('My Group');
        });
    });
  });

  describe('/groups (GET)', () => {
    it('should return groups list', () => {
      return request(app.getHttpServer() as string)
        .get('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res: request.Response) => {
          const body = res.body as unknown[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/groups/:id (PATCH)', () => {
    it('should update group', () => {
      return request(app.getHttpServer() as string)
        .patch(`/groups/${createdGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Group' })
        .expect(200)
        .expect((res: request.Response) => {
          const body = res.body as { name: string };
          expect(body.name).toBe('Updated Group');
        });
    });
  });

  describe('/groups/:id (DELETE)', () => {
    it('should delete group', () => {
      return request(app.getHttpServer() as string)
        .delete(`/groups/${createdGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
