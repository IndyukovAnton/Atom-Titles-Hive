import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaFiles1768297695198 implements MigrationInterface {
    name = 'AddMediaFiles1768297695198'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "media_files" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "url" text NOT NULL, "type" varchar(20) NOT NULL DEFAULT ('image'), "mediaId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_media_files" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "url" text NOT NULL, "type" varchar(20) NOT NULL DEFAULT ('image'), "mediaId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_d9ebcae21d44cc576a4f569486d" FOREIGN KEY ("mediaId") REFERENCES "media_entries" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_media_files"("id", "url", "type", "mediaId", "createdAt") SELECT "id", "url", "type", "mediaId", "createdAt" FROM "media_files"`);
        await queryRunner.query(`DROP TABLE "media_files"`);
        await queryRunner.query(`ALTER TABLE "temporary_media_files" RENAME TO "media_files"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" RENAME TO "temporary_media_files"`);
        await queryRunner.query(`CREATE TABLE "media_files" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "url" text NOT NULL, "type" varchar(20) NOT NULL DEFAULT ('image'), "mediaId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "media_files"("id", "url", "type", "mediaId", "createdAt") SELECT "id", "url", "type", "mediaId", "createdAt" FROM "temporary_media_files"`);
        await queryRunner.query(`DROP TABLE "temporary_media_files"`);
        await queryRunner.query(`DROP TABLE "media_files"`);
    }

}
