import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserIdToClaims1681234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "claims",
      new TableColumn({
        name: "user_id",
        type: "uuid",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("claims", "user_id");
  }
}