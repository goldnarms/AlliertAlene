using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataGenerator.Models
{
    public class BaseData
    {
        [Key]
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Text { get; set; }
        public int CenterLocationId { get; set; }
        [ForeignKey("CenterLocationId")]
        public virtual Location CenterLocation { get; set; }
        public virtual ICollection<FeatureLocation> FeatureLocations { get; set; }
        public virtual ICollection<MediaAsset> MediaAssets { get; set; }

        public class MediaAsset
        {
            [Key]
            public int Id { get; set; }
            public MediaType MediaType { get; set; }
            public string Poster { get; set; }
            public string Reference { get; set; }
            public string Description { get; set; }
            public int BaseDataId { get; set; }
            [ForeignKey("BaseDataId")]
            public virtual BaseData BaseData { get; set; }
        }

        public class Location
        {
            [Key]
            public int Id { get; set; }
            public int CoordinateId { get; set; }
            public string Place { get; set; }
            public bool IsRegion { get; set; }
            [ForeignKey("CoordinateId")]
            public virtual Coordinate Coordinate { get; set; }
            public virtual ICollection<FeatureLocation> FeatureLocations { get; set; }
        }

        public class Coordinate
        {
            [Key]
            public int Id { get; set; }
            public float Lat { get; set; }
            public float Lng { get; set; }
        }

        public class FeatureLocation
        {
            [Key, Column(Order = 0)]
            public int BaseDataId { get; set; }

            [ForeignKey("BaseDataId")]
            public virtual BaseData BaseData { get; set; }
            [Key, Column(Order = 1)]
            public int LocationId { get; set; }
            [ForeignKey("LocationId")]
            public virtual Location Location { get; set; }

            public MarkerType MarkerType { get; set; }
        }
    }

    public enum MediaType
    {
        Image,
        Video,
        Diary
    }

    public enum MarkerType
    {
        Ship = 0,
        Video = 1,
        Diary = 2,
        Region = 3,
        Plane = 4,
        Battle = 5
    }
}
