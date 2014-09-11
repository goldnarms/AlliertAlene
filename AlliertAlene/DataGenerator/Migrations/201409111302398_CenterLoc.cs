namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class CenterLoc : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.BaseDatas", "CenterLocation_Id", c => c.Int());
            CreateIndex("dbo.BaseDatas", "CenterLocation_Id");
            AddForeignKey("dbo.BaseDatas", "CenterLocation_Id", "dbo.Locations", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.BaseDatas", "CenterLocation_Id", "dbo.Locations");
            DropIndex("dbo.BaseDatas", new[] { "CenterLocation_Id" });
            DropColumn("dbo.BaseDatas", "CenterLocation_Id");
        }
    }
}
