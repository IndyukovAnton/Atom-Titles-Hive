import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuthFields1768473242770 implements MigrationInterface {
  name = 'AddGoogleAuthFields1768473242770';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support multiple columns in one ALTER TABLE, but TypeORM handles it if we do it separately
    await queryRunner.query(`ALTER TABLE "users" ADD "googleId" varchar`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_googleId" ON "users" ("googleId")`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar" varchar`);

    // Handle password column nullable - SQLite doesn't support ALTER COLUMN
    // We need to create a temporary table, copy data, and rename
    // However, TypeORM Migrations usually handle this.
    // For simplicity in SQLite, if we just want to allow NULL, we might need a full table recreation if it was NOT NULL before.
    // Let's check the current schema.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_googleId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleId"`);
  }
}
