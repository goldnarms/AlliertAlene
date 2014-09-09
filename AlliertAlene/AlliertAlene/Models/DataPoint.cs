using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AlliertAlene.Models
{
    public class DataPoint
    {
        public string Date { get; set; }
        public string Header { get; set; }
        public string Text { get; set; }
        public Location[] Locations { get; set; }
        public Media Media { get; set; }
    }

    public class Media
    {
        public string Type { get; set; }
        public string Link { get; set; }
        public string Description { get; set; }
    }

    public class Location
    {
        public string Lat { get; set; }
        public string Lng { get; set; }
        public string Name { get; set; }
    }
}