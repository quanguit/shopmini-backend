import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTable1760000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')
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
    await queryRunner.query(`DROP TABLE "order"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}
