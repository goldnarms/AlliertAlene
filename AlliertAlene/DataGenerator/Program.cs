﻿using System;
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
            var locations = new List<BaseData.Location>
            {
                new BaseData.Location
                {
                    Coordinate = new BaseData.Coordinate
                    {
                        Lng = 59.7f,
                        Lat = 10.6f
                    },
                    MarkerType = 3,
                    Place = "Østlandet"
                },
                new BaseData.Location
                {
                    Coordinate = new BaseData.Coordinate
                    {
                        Lng = 59.7f,
                        Lat = 10.6f
                    },
                    MarkerType = 3,
                    Place = "Vestlandet"
                },
                new BaseData.Location
                {
                    Coordinate = new BaseData.Coordinate
                    {
                        Lng = 63.5f,
                        Lat = 10.5f
                    },
                    MarkerType = 3,
                    Place = "Trøndelag"
                },
                new BaseData.Location
                {
                    Coordinate = new BaseData.Coordinate
                    {
                        Lng = 68.4f,
                        Lat = 17.4f
                    },
                    MarkerType = 3,
                    Place = "Nord-Norge"
                }
            };

            using (var ctx = new AlliedDbContext())
            {
                //ctx.Loacations.AddRange(locations);
                //ctx.SaveChanges();
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
