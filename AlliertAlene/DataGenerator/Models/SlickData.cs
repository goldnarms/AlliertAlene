using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataGenerator.Models
{
    public class SlickFeature
    {
        public IEnumerable<SlickData> dates { get; set; }
    }
    public class SlickData
    {
        public string date { get; set; }
        public IEnumerable<FeatureDate> features{ get; set; }
    }

    public class FeatureDate
    {
        public string id { get; set; }
        public string header { get; set; }

    }
}
