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
        public ICollection<DataLocation> Locations { get; set; }
    }
}