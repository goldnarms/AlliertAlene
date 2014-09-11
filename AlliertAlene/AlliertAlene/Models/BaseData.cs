using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AlliertAlene.Models
{
    public class BaseDataViewModel
    {
        [Key]
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Region { get; set; }
        public string Text { get; set; }
        public int Media { get; set; }
        public string Reference { get; set; }
        public string Description { get; set; }
    }

    public class MediaAsset
    {
        [Key]
        public int Id { get; set; }
        public MediaType MediaType { get; set; }
        public string Reference { get; set; }
        public string Description { get; set; }
    }

    public class DataLocation
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


    public enum MediaType
    {
        Image,
        Video
    }
}
