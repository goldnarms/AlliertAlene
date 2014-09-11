using System.ComponentModel.DataAnnotations;

namespace AlliertAlene.Models
{
    public class VmCoordinate
    {
        [Key]
        public int Id { get; set; }
        public float Lat { get; set; }
        public float Lng { get; set; }
    }
}