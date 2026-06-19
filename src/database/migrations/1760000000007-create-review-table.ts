import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewTable1760000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "review" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "rating" integer NOT NULL,
        "comment" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_review_rating_1_to_5" CHECK ("rating" >= 1 AND "rating" <= 5),
        CONSTRAINT "FK_review_product" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_review_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "review"`);
  }
}
