import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTable1760000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "product_status_enum" AS ENUM ('draft', 'published')
    `);

    await queryRunner.query(`
      CREATE TABLE "product" (
        "id" SERIAL NOT NULL,
        "seller_id" integer NOT NULL,
        "category_id" integer NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "stock" integer NOT NULL,
        "images" text[] NOT NULL DEFAULT '{}',
        "status" "product_status_enum" NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_seller" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_product_category" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product"`);
    await queryRunner.query(`DROP TYPE "product_status_enum"`);
  }
}
