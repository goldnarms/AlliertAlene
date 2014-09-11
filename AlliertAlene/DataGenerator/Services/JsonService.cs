using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataGenerator.Extensions;
using DataGenerator.Models;
using Newtonsoft.Json;

namespace DataGenerator.Services
{
    public class JsonService
    {
        public JsonService()
        {
            
        }

        public void GenerateJson(IEnumerable<BaseData> data)
        {
            var dateList = new List<Date>();
            var featureList = new List<Feature>();
            var i = 0;
            foreach (var baseData in data)
            {
                i++;
                dateList.Add(new Date
                {
                    classname = "",
                    endDate = "",
                    headline = baseData.Region,
                    id = string.Format("aa{0}", i.ToString("00000")),
                    startDate = baseData.Date.ToString("yyyy,MM,dd"),
                    tag = "",
                    text = ""
                });
                int j = 0;
                char[] alphabet = { 'a', 'b', 'c', 'd', 'e' };
                foreach (var location in baseData.Locations)
                {
                    featureList.Add(new Feature
                    {
                        geometry = new Geometry
                        {
                            coordinates = new[] { location.Coordinate.Lng, location.Coordinate.Lat },
                            type = "Point"
                        },
                        id = string.Format("aa{0}{1}", i.ToString("00000"), alphabet[j]),
                        type = "Feature",
                        properties = new Properties
                        {
                            header = baseData.Region,
                            id = string.Format("aa{0}", i.ToString("00000")),
                            place = location.Place,
                            marker = location.MarkerType,
                            text = baseData.Text,
                            media = new Media
                            {
                                description = baseData.Media.Description,
                                link = baseData.Media.Reference,
                                type = baseData.Media.MediaType == MediaType.Image ? "img" : "video"
                            },
                            time = baseData.Date.ToUnixTime(),
                            centerCoordinates = new[] { baseData.CenterLocation.Coordinate.Lng, baseData.CenterLocation.Coordinate.Lat },
                        }
                    });
                    j++;
                }
            }
            var geoData = new GeoData
            {
                features = featureList.ToArray(),
                type = "FeatureCollection",
                metadata = new Metadata
                {
                    count = 0,
                    generated = DateTime.Now.ToUnixTime(),
                    title = "Alliert og alene"
                }
            };
            var timelineData = new TimelineData { timeline = new Timeline { headline = "Alliert og alene", text = "", type = "default", date = dateList.ToArray() } };

            string geoJson = JsonConvert.SerializeObject(geoData);
            string timelineJson = JsonConvert.SerializeObject(timelineData);
            // Write that JSON to txt file
            File.WriteAllText(Environment.CurrentDirectory + @"\dataPoints.geojson", geoJson);
            File.WriteAllText(Environment.CurrentDirectory + @"\timeline.json", timelineJson);
        }
    }
}
