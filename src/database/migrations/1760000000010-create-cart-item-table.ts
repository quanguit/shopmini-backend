import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartItemTable1760000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cart_item" (
        "id" SERIAL NOT NULL,
        "cart_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_item_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_item_cart" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_cart_item_product" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cart_item"`);
  }
}
