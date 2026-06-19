import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentTable1760000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "payment_method_enum" AS ENUM ('credit_card', 'bank_transfer', 'cash_on_delivery')
    `);

    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'success', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "payment" (
        "id" SERIAL NOT NULL,
        "order_id" integer NOT NULL,
        "method" "payment_method_enum" NOT NULL DEFAULT 'cash_on_delivery',
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "transaction_ref" character varying,
        "paid_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_order_id" UNIQUE ("order_id"),
        CONSTRAINT "FK_payment_order" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_method_enum"`);
  }
}
