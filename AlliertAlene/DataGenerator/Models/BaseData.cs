using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DataGenerator.Models
{
    public class BaseData
    {
        [Key]
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Region { get; set; }
        public string Text { get; set; }
        public Location CenterLocation { get; set; }
        public List<Location> Locations { get; set; }
        public MediaAsset Media { get; set; }

        public class MediaAsset
        {
            [Key]
            public int Id { get; set; }
            public MediaType MediaType { get; set; }
            public string Poster { get; set; }
            public string Reference { get; set; }
            public string Description { get; set; }
        }

        public class Location
        {
            [Key]
            public int Id { get; set; }
            public Coordinate Coordinate { get; set; }
            public string Place { get; set; }
            public int MarkerType { get; set; }
        }

        public class Coordinate
        {
            [Key]
            public int Id { get; set; }
            public float Lat { get; set; }
            public float Lng { get; set; }
        }
    }

    public enum MediaType
    {
        Image,
        Video,
        Diary
    }
}
