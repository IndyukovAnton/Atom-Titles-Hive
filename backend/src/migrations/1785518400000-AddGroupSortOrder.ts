import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupSortOrder1785518400000 implements MigrationInterface {
  name = 'AddGroupSortOrder1785518400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "groups" ADD COLUMN "sortOrder" integer NOT NULL DEFAULT (0)`,
    );

    // Backfill: 0-based порядок внутри каждой группы siblings
    // (userId + parentId) по дате создания. IS корректно сравнивает NULL parentId.
    await queryRunner.query(`
      UPDATE "groups" SET "sortOrder" = (
        SELECT COUNT(*) FROM "groups" AS g2
        WHERE g2."userId" = "groups"."userId"
          AND g2."parentId" IS "groups"."parentId"
          AND (
            g2."createdAt" < "groups"."createdAt"
            OR (g2."createdAt" = "groups"."createdAt" AND g2."id" < "groups"."id")
          )
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_groups_userId_parentId_sortOrder" ON "groups" ("userId", "parentId", "sortOrder")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_groups_userId_parentId_sortOrder"`,
    );
    // DROP COLUMN требует SQLite >= 3.35 (sqlite3@5.x поставляется с 3.40+)
    await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "sortOrder"`);
  }
}
