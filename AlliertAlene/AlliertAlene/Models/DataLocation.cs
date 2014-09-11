using System.ComponentModel.DataAnnotations;

namespace AlliertAlene.Models
{
    public class DataLocation
    {
        [Key]
        public int Id { get; set; }
        public VmCoordinate VmCoordinate { get; set; }
        public string Place { get; set; }
        public int MarkerType { get; set; }
    }
}