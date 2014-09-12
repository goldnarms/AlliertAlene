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
    }
}
