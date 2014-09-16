namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class manytimany : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.MediaAssets", "BaseData_Id", "dbo.BaseDatas");
            DropIndex("dbo.MediaAssets", new[] { "BaseData_Id" });
            RenameColumn(table: "dbo.MediaAssets", name: "BaseData_Id", newName: "BaseDataId");
            AddColumn("dbo.BaseDatas", "Location_Id", c => c.Int());
            AlterColumn("dbo.MediaAssets", "BaseDataId", c => c.Int(nullable: false));
            CreateIndex("dbo.BaseDatas", "Location_Id");
            CreateIndex("dbo.MediaAssets", "BaseDataId");
            AddForeignKey("dbo.BaseDatas", "Location_Id", "dbo.Locations", "Id");
            AddForeignKey("dbo.MediaAssets", "BaseDataId", "dbo.BaseDatas", "Id", cascadeDelete: true);
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.MediaAssets", "BaseDataId", "dbo.BaseDatas");
            DropForeignKey("dbo.BaseDatas", "Location_Id", "dbo.Locations");
            DropIndex("dbo.MediaAssets", new[] { "BaseDataId" });
            DropIndex("dbo.BaseDatas", new[] { "Location_Id" });
            AlterColumn("dbo.MediaAssets", "BaseDataId", c => c.Int());
            DropColumn("dbo.BaseDatas", "Location_Id");
            RenameColumn(table: "dbo.MediaAssets", name: "BaseDataId", newName: "BaseData_Id");
            CreateIndex("dbo.MediaAssets", "BaseData_Id");
            AddForeignKey("dbo.MediaAssets", "BaseData_Id", "dbo.BaseDatas", "Id");
        }
    }
}
