using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Web;
using System.Web.Mvc;

namespace AlliertAlene.Models
{
    public class BaseDataViewModel
    {
        [Key]
        public int Id { get; set; }
        [DataType(DataType.DateTime)]
        public DateTime Date { get; set; }
        public string Region { get; set; }
        [DataType(DataType.Html)]
        public string Text { get; set; }
        public int Media { get; set; }
        public string Reference { get; set; }
        public string Description { get; set; }
        public List<DataLocation> Locations { get; set; }
        [DataType(DataType.Upload)]
        public HttpPostedFileBase ImageUpload { get; set; }
        public DataLocation CenterLocation { get; set; }
    }
}