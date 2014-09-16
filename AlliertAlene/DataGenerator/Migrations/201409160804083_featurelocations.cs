namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class featurelocations : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.BaseDatas", "Location_Id", "dbo.Locations");
            DropForeignKey("dbo.Locations", "BaseData_Id", "dbo.BaseDatas");
            DropIndex("dbo.BaseDatas", new[] { "Location_Id" });
            DropIndex("dbo.Locations", new[] { "BaseData_Id" });
            CreateTable(
                "dbo.FeatureLocations",
                c => new
                    {
                        BaseDataId = c.Int(nullable: false),
                        LocationId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.BaseDataId, t.LocationId })
                .ForeignKey("dbo.BaseDatas", t => t.BaseDataId, cascadeDelete: false)
                .ForeignKey("dbo.Locations", t => t.LocationId, cascadeDelete: false)
                .Index(t => t.BaseDataId)
                .Index(t => t.LocationId);
            
            DropColumn("dbo.BaseDatas", "Location_Id");
            DropColumn("dbo.Locations", "BaseData_Id");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Locations", "BaseData_Id", c => c.Int());
            AddColumn("dbo.BaseDatas", "Location_Id", c => c.Int());
            DropForeignKey("dbo.FeatureLocations", "LocationId", "dbo.Locations");
            DropForeignKey("dbo.FeatureLocations", "BaseDataId", "dbo.BaseDatas");
            DropIndex("dbo.FeatureLocations", new[] { "LocationId" });
            DropIndex("dbo.FeatureLocations", new[] { "BaseDataId" });
            DropTable("dbo.FeatureLocations");
            CreateIndex("dbo.Locations", "BaseData_Id");
            CreateIndex("dbo.BaseDatas", "Location_Id");
            AddForeignKey("dbo.Locations", "BaseData_Id", "dbo.BaseDatas", "Id");
            AddForeignKey("dbo.BaseDatas", "Location_Id", "dbo.Locations", "Id");
        }
    }
}
