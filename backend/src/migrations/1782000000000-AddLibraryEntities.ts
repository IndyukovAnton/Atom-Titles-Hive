import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLibraryEntities1782000000000 implements MigrationInterface {
  name = 'AddLibraryEntities1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "saved_recommendations" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" integer NOT NULL,
        "title" varchar(300) NOT NULL,
        "originalTitle" varchar(300),
        "type" varchar(16) NOT NULL,
        "year" integer,
        "genres" json,
        "whyRecommended" text NOT NULL,
        "estimatedRating" real,
        "releasedRecently" boolean,
        "posterUrl" text,
        "sourceModel" varchar(64),
        "status" varchar(16) NOT NULL DEFAULT 'considering',
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_saved_recommendations_user"
          FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_saved_recommendations_userId" ON "saved_recommendations" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_saved_recommendations_userId_status" ON "saved_recommendations" ("userId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_saved_recommendations_userId_createdAt" ON "saved_recommendations" ("userId", "createdAt")`,
    );

    await queryRunner.query(
      `CREATE TABLE "media_favorites" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" integer NOT NULL,
        "mediaEntryId" integer NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_media_favorites_user_media" UNIQUE ("userId", "mediaEntryId"),
        CONSTRAINT "FK_media_favorites_user"
          FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_media_favorites_media"
          FOREIGN KEY ("mediaEntryId") REFERENCES "media_entries" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_favorites_userId" ON "media_favorites" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_favorites_userId_createdAt" ON "media_favorites" ("userId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_media_favorites_userId_createdAt"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_media_favorites_userId"`);
    await queryRunner.query(`DROP TABLE "media_favorites"`);
    await queryRunner.query(
      `DROP INDEX "IDX_saved_recommendations_userId_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_saved_recommendations_userId_status"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_saved_recommendations_userId"`);
    await queryRunner.query(`DROP TABLE "saved_recommendations"`);
  }
}
