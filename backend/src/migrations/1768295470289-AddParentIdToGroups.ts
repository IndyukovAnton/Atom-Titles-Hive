import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentIdToGroups1768295470289 implements MigrationInterface {
    name = 'AddParentIdToGroups1768295470289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_media_entries_userId_category"`);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_groupId"`);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_userId"`);
        await queryRunner.query(`CREATE TABLE "temporary_media_entries" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(200) NOT NULL, "image" text, "description" text, "rating" integer NOT NULL DEFAULT (5), "startDate" datetime, "endDate" datetime, "genres" text, "category" varchar(100), "tags" text, "userId" integer NOT NULL, "groupId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_media_entries"("id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt") SELECT "id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt" FROM "media_entries"`);
        await queryRunner.query(`DROP TABLE "media_entries"`);
        await queryRunner.query(`ALTER TABLE "temporary_media_entries" RENAME TO "media_entries"`);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_userId_category" ON "media_entries" ("userId", "category") `);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_groupId" ON "media_entries" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_userId" ON "media_entries" ("userId") `);
        await queryRunner.query(`DROP INDEX "IDX_groups_userId"`);
        await queryRunner.query(`CREATE TABLE "temporary_groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "userId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_groups"("id", "name", "userId", "createdAt", "updatedAt") SELECT "id", "name", "userId", "createdAt", "updatedAt" FROM "groups"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`ALTER TABLE "temporary_groups" RENAME TO "groups"`);
        await queryRunner.query(`CREATE INDEX "IDX_groups_userId" ON "groups" ("userId") `);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_userId_category"`);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_groupId"`);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_groups_userId"`);
        await queryRunner.query(`CREATE TABLE "temporary_groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "userId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "parentId" integer)`);
        await queryRunner.query(`INSERT INTO "temporary_groups"("id", "name", "userId", "createdAt", "updatedAt") SELECT "id", "name", "userId", "createdAt", "updatedAt" FROM "groups"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`ALTER TABLE "temporary_groups" RENAME TO "groups"`);
        await queryRunner.query(`CREATE INDEX "IDX_3a2bf5058657d6bf11a6274eb6" ON "media_entries" ("userId", "category") `);
        await queryRunner.query(`CREATE INDEX "IDX_443b6f01298974d77193dbd3ad" ON "media_entries" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_82748b983cf78075daa9ed2b46" ON "media_entries" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_898cf6af34722df13f760cc364" ON "groups" ("userId") `);
        await queryRunner.query(`DROP INDEX "IDX_3a2bf5058657d6bf11a6274eb6"`);
        await queryRunner.query(`DROP INDEX "IDX_443b6f01298974d77193dbd3ad"`);
        await queryRunner.query(`DROP INDEX "IDX_82748b983cf78075daa9ed2b46"`);
        await queryRunner.query(`CREATE TABLE "temporary_media_entries" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(200) NOT NULL, "image" text, "description" text, "rating" integer NOT NULL DEFAULT (5), "startDate" datetime, "endDate" datetime, "genres" text, "category" varchar(100), "tags" text, "userId" integer NOT NULL, "groupId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_82748b983cf78075daa9ed2b465" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_443b6f01298974d77193dbd3ad1" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_media_entries"("id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt") SELECT "id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt" FROM "media_entries"`);
        await queryRunner.query(`DROP TABLE "media_entries"`);
        await queryRunner.query(`ALTER TABLE "temporary_media_entries" RENAME TO "media_entries"`);
        await queryRunner.query(`CREATE INDEX "IDX_3a2bf5058657d6bf11a6274eb6" ON "media_entries" ("userId", "category") `);
        await queryRunner.query(`CREATE INDEX "IDX_443b6f01298974d77193dbd3ad" ON "media_entries" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_82748b983cf78075daa9ed2b46" ON "media_entries" ("userId") `);
        await queryRunner.query(`DROP INDEX "IDX_898cf6af34722df13f760cc364"`);
        await queryRunner.query(`CREATE TABLE "temporary_groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "userId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "parentId" integer, CONSTRAINT "FK_898cf6af34722df13f760cc364f" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_2dbdff6d03e57660064791a7682" FOREIGN KEY ("parentId") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_groups"("id", "name", "userId", "createdAt", "updatedAt", "parentId") SELECT "id", "name", "userId", "createdAt", "updatedAt", "parentId" FROM "groups"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`ALTER TABLE "temporary_groups" RENAME TO "groups"`);
        await queryRunner.query(`CREATE INDEX "IDX_898cf6af34722df13f760cc364" ON "groups" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_898cf6af34722df13f760cc364"`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME TO "temporary_groups"`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "userId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "parentId" integer)`);
        await queryRunner.query(`INSERT INTO "groups"("id", "name", "userId", "createdAt", "updatedAt", "parentId") SELECT "id", "name", "userId", "createdAt", "updatedAt", "parentId" FROM "temporary_groups"`);
        await queryRunner.query(`DROP TABLE "temporary_groups"`);
        await queryRunner.query(`CREATE INDEX "IDX_898cf6af34722df13f760cc364" ON "groups" ("userId") `);
        await queryRunner.query(`DROP INDEX "IDX_82748b983cf78075daa9ed2b46"`);
        await queryRunner.query(`DROP INDEX "IDX_443b6f01298974d77193dbd3ad"`);
        await queryRunner.query(`DROP INDEX "IDX_3a2bf5058657d6bf11a6274eb6"`);
        await queryRunner.query(`ALTER TABLE "media_entries" RENAME TO "temporary_media_entries"`);
        await queryRunner.query(`CREATE TABLE "media_entries" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(200) NOT NULL, "image" text, "description" text, "rating" integer NOT NULL DEFAULT (5), "startDate" datetime, "endDate" datetime, "genres" text, "category" varchar(100), "tags" text, "userId" integer NOT NULL, "groupId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "media_entries"("id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt") SELECT "id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt" FROM "temporary_media_entries"`);
        await queryRunner.query(`DROP TABLE "temporary_media_entries"`);
        await queryRunner.query(`CREATE INDEX "IDX_82748b983cf78075daa9ed2b46" ON "media_entries" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_443b6f01298974d77193dbd3ad" ON "media_entries" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a2bf5058657d6bf11a6274eb6" ON "media_entries" ("userId", "category") `);
        await queryRunner.query(`DROP INDEX "IDX_898cf6af34722df13f760cc364"`);
        await queryRunner.query(`DROP INDEX "IDX_82748b983cf78075daa9ed2b46"`);
        await queryRunner.query(`DROP INDEX "IDX_443b6f01298974d77193dbd3ad"`);
        await queryRunner.query(`DROP INDEX "IDX_3a2bf5058657d6bf11a6274eb6"`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME TO "temporary_groups"`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "userId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "groups"("id", "name", "userId", "createdAt", "updatedAt") SELECT "id", "name", "userId", "createdAt", "updatedAt" FROM "temporary_groups"`);
        await queryRunner.query(`DROP TABLE "temporary_groups"`);
        await queryRunner.query(`CREATE INDEX "IDX_groups_userId" ON "groups" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_userId" ON "media_entries" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_groupId" ON "media_entries" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_userId_category" ON "media_entries" ("userId", "category") `);
        await queryRunner.query(`DROP INDEX "IDX_groups_userId"`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME TO "temporary_groups"`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "userId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_groups_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "groups"("id", "name", "userId", "createdAt", "updatedAt") SELECT "id", "name", "userId", "createdAt", "updatedAt" FROM "temporary_groups"`);
        await queryRunner.query(`DROP TABLE "temporary_groups"`);
        await queryRunner.query(`CREATE INDEX "IDX_groups_userId" ON "groups" ("userId") `);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_groupId"`);
        await queryRunner.query(`DROP INDEX "IDX_media_entries_userId_category"`);
        await queryRunner.query(`ALTER TABLE "media_entries" RENAME TO "temporary_media_entries"`);
        await queryRunner.query(`CREATE TABLE "media_entries" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(200) NOT NULL, "image" text, "description" text, "rating" integer NOT NULL DEFAULT (5), "startDate" datetime, "endDate" datetime, "genres" text, "category" varchar(100), "tags" text, "userId" integer NOT NULL, "groupId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_media_entries_groupId" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_media_entries_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "media_entries"("id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt") SELECT "id", "title", "image", "description", "rating", "startDate", "endDate", "genres", "category", "tags", "userId", "groupId", "createdAt", "updatedAt" FROM "temporary_media_entries"`);
        await queryRunner.query(`DROP TABLE "temporary_media_entries"`);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_userId" ON "media_entries" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_groupId" ON "media_entries" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_media_entries_userId_category" ON "media_entries" ("userId", "category") `);
    }

}
