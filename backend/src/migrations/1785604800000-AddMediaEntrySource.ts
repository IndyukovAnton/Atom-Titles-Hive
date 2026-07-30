import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaEntrySource1785604800000 implements MigrationInterface {
  name = 'AddMediaEntrySource1785604800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_entries" ADD COLUMN "source" varchar(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // DROP COLUMN требует SQLite >= 3.35 (sqlite3@5.x поставляется с 3.40+)
    await queryRunner.query(`ALTER TABLE "media_entries" DROP COLUMN "source"`);
  }
}
