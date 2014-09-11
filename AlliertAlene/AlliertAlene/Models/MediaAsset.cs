using System.ComponentModel.DataAnnotations;

namespace AlliertAlene.Models
{
    public class MediaAsset
    {
        [Key]
        public int Id { get; set; }
        public MediaType MediaType { get; set; }
        public string Reference { get; set; }
        public string Description { get; set; }
    }
}