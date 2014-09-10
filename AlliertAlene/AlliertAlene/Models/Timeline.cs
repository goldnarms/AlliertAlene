namespace AlliertAlene.Models
{
    public class TimelineData
    {
        public Timeline timeline { get; set; }
    }

    public class Timeline
    {
        public string headline { get; set; }
        public string type { get; set; }
        public string text { get; set; }
        public Date[] date { get; set; }
    }

    public class Date
    {
        public string startDate { get; set; }
        public string endDate { get; set; }
        public string headline { get; set; }
        public string text { get; set; }
        public string tag { get; set; }
        public string classname { get; set; }
        public string id { get; set; }
    }
}
