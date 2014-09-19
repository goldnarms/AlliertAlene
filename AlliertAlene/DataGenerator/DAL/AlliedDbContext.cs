using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using DataGenerator.Models;

namespace DataGenerator.DAL
{
    public class AlliedDbContext : DbContext
    {
        public AlliedDbContext() : base("AlliedContext")
        {
        }

        public DbSet<BaseData> Datas { get; set; }
        public DbSet<BaseData.Location> Locations { get; set; }
        public DbSet<BaseData.FeatureLocation> FeatureLocations { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            //modelBuilder.Entity<BaseData>()
            //    .HasMany(x => x.FeatureLocations)
            //    .WithMany(x => x.BaseDatas)
            //.Map(x =>
            //{
            //    x.ToTable("FeatureLocations"); // third table is named Cookbooks
            //    x.MapLeftKey("BaseDataId");
            //    x.MapRightKey("LocationId");
            //});
        }
    }
}
