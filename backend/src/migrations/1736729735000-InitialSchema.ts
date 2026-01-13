import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1736729735000 implements MigrationInterface {
  name = 'InitialSchema1736729735000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar(50) NOT NULL,
        "email" varchar(100) NOT NULL,
        "password" varchar(255) NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_username" UNIQUE ("username"),
        CONSTRAINT "UQ_email" UNIQUE ("email")
      )
    `);

    // Create groups table
    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar(100) NOT NULL,
        "userId" integer NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_groups_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    // Create index on groups.userId
    await queryRunner.query(`
      CREATE INDEX "IDX_groups_userId" ON "groups" ("userId")
    `);

    // Create media_entries table
    await queryRunner.query(`
      CREATE TABLE "media_entries" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "title" varchar(200) NOT NULL,
        "image" text,
        "description" text,
        "rating" integer NOT NULL DEFAULT (5),
        "startDate" datetime,
        "endDate" datetime,
        "genres" text,
        "category" varchar(100),
        "tags" text,
        "userId" integer NOT NULL,
        "groupId" integer,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_media_entries_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_media_entries_groupId" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE SET NULL
      )
    `);

    // Create indexes on media_entries
    await queryRunner.query(`
      CREATE INDEX "IDX_media_entries_userId" ON "media_entries" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_media_entries_groupId" ON "media_entries" ("groupId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_media_entries_userId_category" ON "media_entries" ("userId", "category")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_media_entries_userId_category"`);
    await queryRunner.query(`DROP INDEX "IDX_media_entries_groupId"`);
    await queryRunner.query(`DROP INDEX "IDX_media_entries_userId"`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "media_entries"`);
    await queryRunner.query(`DROP INDEX "IDX_groups_userId"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
