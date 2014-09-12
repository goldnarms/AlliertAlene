namespace DataGenerator.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Poster : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.MediaAssets", "Poster", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.MediaAssets", "Poster");
        }
    }
}
