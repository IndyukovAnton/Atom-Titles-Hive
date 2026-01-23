import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPersonalization1768446524526 implements MigrationInterface {
  name = 'AddUserPersonalization1768446524526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar(50) NOT NULL, "email" varchar(100) NOT NULL, "password" varchar(255) NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "birthDate" date, "preferences" json, "hasCompletedOnboarding" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_email" UNIQUE ("email"), CONSTRAINT "UQ_username" UNIQUE ("username"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_users"("id", "username", "email", "password", "createdAt", "updatedAt") SELECT "id", "username", "email", "password", "createdAt", "updatedAt" FROM "users"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar(50) NOT NULL, "email" varchar(100) NOT NULL, "password" varchar(255) NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_email" UNIQUE ("email"), CONSTRAINT "UQ_username" UNIQUE ("username"))`,
    );
    await queryRunner.query(
      `INSERT INTO "users"("id", "username", "email", "password", "createdAt", "updatedAt") SELECT "id", "username", "email", "password", "createdAt", "updatedAt" FROM "temporary_users"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_users"`);
  }
}
