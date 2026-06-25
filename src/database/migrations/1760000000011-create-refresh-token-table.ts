import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokenTable1760000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_token" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP,
        "replaced_by_token_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_token_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_token_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_refresh_token_replaced_by" FOREIGN KEY ("replaced_by_token_id") REFERENCES "refresh_token"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_token_user_id" ON "refresh_token" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_token_token_hash" ON "refresh_token" ("token_hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_token_token_hash"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_token_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_token"`);
  }
}
