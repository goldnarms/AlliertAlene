namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class InitialCreate : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.BaseDatas",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Date = c.DateTime(nullable: false),
                        Region = c.String(),
                        Text = c.String(),
                        Media_Id = c.Int(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.MediaAssets", t => t.Media_Id)
                .Index(t => t.Media_Id);
            
            CreateTable(
                "dbo.Locations",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Place = c.String(),
                        MarkerType = c.Int(nullable: false),
                        Coordinate_Id = c.Int(),
                        BaseData_Id = c.Int(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Coordinates", t => t.Coordinate_Id)
                .ForeignKey("dbo.BaseDatas", t => t.BaseData_Id)
                .Index(t => t.Coordinate_Id)
                .Index(t => t.BaseData_Id);
            
            CreateTable(
                "dbo.Coordinates",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Lat = c.Single(nullable: false),
                        Lng = c.Single(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.MediaAssets",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        MediaType = c.Int(nullable: false),
                        Reference = c.String(),
                        Description = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.BaseDatas", "Media_Id", "dbo.MediaAssets");
            DropForeignKey("dbo.Locations", "BaseData_Id", "dbo.BaseDatas");
            DropForeignKey("dbo.Locations", "Coordinate_Id", "dbo.Coordinates");
            DropIndex("dbo.Locations", new[] { "BaseData_Id" });
            DropIndex("dbo.Locations", new[] { "Coordinate_Id" });
            DropIndex("dbo.BaseDatas", new[] { "Media_Id" });
            DropTable("dbo.MediaAssets");
            DropTable("dbo.Coordinates");
            DropTable("dbo.Locations");
            DropTable("dbo.BaseDatas");
        }
    }
}
