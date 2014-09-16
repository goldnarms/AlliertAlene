using DataGenerator.Models;

namespace AlliertAlene.Models
{
    public class DataFeatureLocation
    {
        public int BaseDataId { get; set; }
        public virtual BaseDataViewModel BaseData { get; set; }
        public int LocationId { get; set; }
        public virtual DataLocation Location { get; set; }
        public MarkerType MarkerType { get; set; }
    }
}