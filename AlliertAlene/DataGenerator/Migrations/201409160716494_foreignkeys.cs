namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class foreignkeys : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.BaseDatas", "Media_Id", "dbo.MediaAssets");
            DropForeignKey("dbo.BaseDatas", "CenterLocation_Id", "dbo.Locations");
            DropForeignKey("dbo.Locations", "Coordinate_Id", "dbo.Coordinates");
            DropIndex("dbo.BaseDatas", new[] { "CenterLocation_Id" });
            DropIndex("dbo.BaseDatas", new[] { "Media_Id" });
            DropIndex("dbo.Locations", new[] { "Coordinate_Id" });
            RenameColumn(table: "dbo.BaseDatas", name: "CenterLocation_Id", newName: "CenterLocationId");
            RenameColumn(table: "dbo.Locations", name: "Coordinate_Id", newName: "CoordinateId");
            AddColumn("dbo.MediaAssets", "BaseData_Id", c => c.Int());
            AlterColumn("dbo.BaseDatas", "CenterLocationId", c => c.Int(nullable: false));
            AlterColumn("dbo.Locations", "CoordinateId", c => c.Int(nullable: false));
            CreateIndex("dbo.BaseDatas", "CenterLocationId");
            CreateIndex("dbo.Locations", "CoordinateId");
            CreateIndex("dbo.MediaAssets", "BaseData_Id");
            AddForeignKey("dbo.MediaAssets", "BaseData_Id", "dbo.BaseDatas", "Id");
            AddForeignKey("dbo.BaseDatas", "CenterLocationId", "dbo.Locations", "Id", cascadeDelete: true);
            AddForeignKey("dbo.Locations", "CoordinateId", "dbo.Coordinates", "Id", cascadeDelete: true);
            DropColumn("dbo.BaseDatas", "Region");
            DropColumn("dbo.BaseDatas", "Media_Id");
        }
        
        public override void Down()
        {
            AddColumn("dbo.BaseDatas", "Media_Id", c => c.Int());
            AddColumn("dbo.BaseDatas", "Region", c => c.String());
            DropForeignKey("dbo.Locations", "CoordinateId", "dbo.Coordinates");
            DropForeignKey("dbo.BaseDatas", "CenterLocationId", "dbo.Locations");
            DropForeignKey("dbo.MediaAssets", "BaseData_Id", "dbo.BaseDatas");
            DropIndex("dbo.MediaAssets", new[] { "BaseData_Id" });
            DropIndex("dbo.Locations", new[] { "CoordinateId" });
            DropIndex("dbo.BaseDatas", new[] { "CenterLocationId" });
            AlterColumn("dbo.Locations", "CoordinateId", c => c.Int());
            AlterColumn("dbo.BaseDatas", "CenterLocationId", c => c.Int());
            DropColumn("dbo.MediaAssets", "BaseData_Id");
            RenameColumn(table: "dbo.Locations", name: "CoordinateId", newName: "Coordinate_Id");
            RenameColumn(table: "dbo.BaseDatas", name: "CenterLocationId", newName: "CenterLocation_Id");
            CreateIndex("dbo.Locations", "Coordinate_Id");
            CreateIndex("dbo.BaseDatas", "Media_Id");
            CreateIndex("dbo.BaseDatas", "CenterLocation_Id");
            AddForeignKey("dbo.Locations", "Coordinate_Id", "dbo.Coordinates", "Id");
            AddForeignKey("dbo.BaseDatas", "CenterLocation_Id", "dbo.Locations", "Id");
            AddForeignKey("dbo.BaseDatas", "Media_Id", "dbo.MediaAssets", "Id");
        }
    }
}
