namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class markertypeMoved : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Locations", "IsRegion", c => c.Boolean(nullable: false));
            DropColumn("dbo.Locations", "MarkerType");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Locations", "MarkerType", c => c.Int(nullable: false));
            DropColumn("dbo.Locations", "IsRegion");
        }
    }
}
