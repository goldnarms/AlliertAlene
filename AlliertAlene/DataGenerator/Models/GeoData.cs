namespace DataGenerator.Models
{

    public class GeoData
    {
        public string type { get; set; }
        public Metadata metadata { get; set; }
        public Feature[] features { get; set; }
    }

    public class Metadata
    {
        public long generated { get; set; }
        public string title { get; set; }
        public int count { get; set; }
    }

    public class Feature
    {
        public string type { get; set; }
        public Properties properties { get; set; }
        public Geometry geometry { get; set; }
        public string id { get; set; }
    }

    public class Properties
    {
        public string id { get; set; }
        public string place { get; set; }
        public long time { get; set; }
        public string header { get; set; }
        public string text { get; set; }
        public Media media { get; set; }
        public int marker { get; set; }
    }

    public class Media
    {
        public string type { get; set; }
        public string link { get; set; }
        public string description { get; set; }
    }

    public class Geometry
    {
        public string type { get; set; }
        public float[] coordinates { get; set; }
    }

}
