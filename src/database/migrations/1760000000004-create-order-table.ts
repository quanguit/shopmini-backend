import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTable1760000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
          CREATE TYPE "order_status_enum" AS ENUM ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE "order" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "status" "order_status_enum" NOT NULL DEFAULT 'pending',
        "total_amount" numeric(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum"`);
  }
}
