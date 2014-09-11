using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataGenerator.DAL;
using DataGenerator.Extensions;
using DataGenerator.Models;
using DataGenerator.Services;
using Newtonsoft.Json;

namespace DataGenerator
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            //var dataService = new BaseDataService();
            //var data = dataService.GetData();
            //using (var ctx = new AlliedDbContext())
            //{
            //    data.ToList().ForEach(d => ctx.Datas.Add(d));
            //    ctx.SaveChanges();
            //}
            using (var ctx = new AlliedDbContext())
            {
                var dataFromDb = ctx.Datas
                    .Include("Locations")
                    .Include("Locations.Coordinate")
                    .Include("CenterLocation")
                    .Include("CenterLocation.Coordinate")
                    .Include("Media").ToList();

                var jsonService = new JsonService();
                jsonService.GenerateJson(dataFromDb);
            }
        }
    }
}
