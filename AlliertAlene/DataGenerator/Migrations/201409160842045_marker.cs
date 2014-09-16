namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class marker : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.FeatureLocations", "BaseDataId", "dbo.BaseDatas");
            DropForeignKey("dbo.FeatureLocations", "LocationId", "dbo.Locations");
            DropIndex("dbo.FeatureLocations", new[] { "BaseDataId" });
            DropIndex("dbo.FeatureLocations", new[] { "LocationId" });
            AddColumn("dbo.BaseDatas", "Location_Id", c => c.Int());
            AddColumn("dbo.Locations", "BaseData_Id", c => c.Int());
            CreateIndex("dbo.BaseDatas", "Location_Id");
            CreateIndex("dbo.Locations", "BaseData_Id");
            AddForeignKey("dbo.BaseDatas", "Location_Id", "dbo.Locations", "Id");
            AddForeignKey("dbo.Locations", "BaseData_Id", "dbo.BaseDatas", "Id");
            DropTable("dbo.FeatureLocations");
        }
        
        public override void Down()
        {
            CreateTable(
                "dbo.FeatureLocations",
                c => new
                    {
                        BaseDataId = c.Int(nullable: false),
                        LocationId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.BaseDataId, t.LocationId });
            
            DropForeignKey("dbo.Locations", "BaseData_Id", "dbo.BaseDatas");
            DropForeignKey("dbo.BaseDatas", "Location_Id", "dbo.Locations");
            DropIndex("dbo.Locations", new[] { "BaseData_Id" });
            DropIndex("dbo.BaseDatas", new[] { "Location_Id" });
            DropColumn("dbo.Locations", "BaseData_Id");
            DropColumn("dbo.BaseDatas", "Location_Id");
            CreateIndex("dbo.FeatureLocations", "LocationId");
            CreateIndex("dbo.FeatureLocations", "BaseDataId");
            AddForeignKey("dbo.FeatureLocations", "LocationId", "dbo.Locations", "Id", cascadeDelete: true);
            AddForeignKey("dbo.FeatureLocations", "BaseDataId", "dbo.BaseDatas", "Id", cascadeDelete: true);
        }
    }
}
