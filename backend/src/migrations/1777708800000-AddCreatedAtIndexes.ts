import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtIndexes1777708800000 implements MigrationInterface {
  name = 'AddCreatedAtIndexes1777708800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_media_entries_userId_createdAt" ON "media_entries" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_groups_userId_createdAt" ON "groups" ("userId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_groups_userId_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_media_entries_userId_createdAt"`);
  }
}
