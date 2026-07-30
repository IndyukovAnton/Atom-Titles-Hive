import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserEmailNullable1785456000000 implements MigrationInterface {
  name = 'MakeUserEmailNullable1785456000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQLite не поддерживает ALTER COLUMN — пересоздаём таблицу.
    // Заодно выравниваем password под entity (nullable для OAuth-only аккаунтов).
    await queryRunner.query(`
      CREATE TABLE "temporary_users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar(50) NOT NULL,
        "email" varchar(100),
        "password" varchar(255),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "birthDate" date,
        "preferences" json,
        "hasCompletedOnboarding" boolean NOT NULL DEFAULT (0),
        "googleId" varchar,
        "avatar" varchar,
        CONSTRAINT "UQ_email" UNIQUE ("email"),
        CONSTRAINT "UQ_username" UNIQUE ("username")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "temporary_users" ("id", "username", "email", "password", "createdAt", "updatedAt", "birthDate", "preferences", "hasCompletedOnboarding", "googleId", "avatar")
      SELECT "id", "username", "email", "password", "createdAt", "updatedAt", "birthDate", "preferences", "hasCompletedOnboarding", "googleId", "avatar" FROM "users"
    `);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);

    // DROP TABLE уносит и индексы — восстанавливаем уникальный индекс googleId
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_googleId" ON "users" ("googleId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат упадёт при наличии NULL в email — осознанное ограничение:
    // обратно NOT NULL без потери данных не вернуть.
    await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar(50) NOT NULL,
        "email" varchar(100) NOT NULL,
        "password" varchar(255),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "birthDate" date,
        "preferences" json,
        "hasCompletedOnboarding" boolean NOT NULL DEFAULT (0),
        "googleId" varchar,
        "avatar" varchar,
        CONSTRAINT "UQ_email" UNIQUE ("email"),
        CONSTRAINT "UQ_username" UNIQUE ("username")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "users" ("id", "username", "email", "password", "createdAt", "updatedAt", "birthDate", "preferences", "hasCompletedOnboarding", "googleId", "avatar")
      SELECT "id", "username", "email", "password", "createdAt", "updatedAt", "birthDate", "preferences", "hasCompletedOnboarding", "googleId", "avatar" FROM "temporary_users"
    `);
    await queryRunner.query(`DROP TABLE "temporary_users"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_googleId" ON "users" ("googleId")`,
    );
  }
}
