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
            string geoJson = JsonConvert.SerializeObject(GenerateFeatures(data));
            string timelineJson = JsonConvert.SerializeObject(GenerateTimeline(data));
            string slickFeatures = JsonConvert.SerializeObject(GenerateSlickFeatures(data));
            WriteToFile(geoJson, "dataPoints.geojson");
            WriteToFile(timelineJson, "timeline.json");
            WriteToFile(slickFeatures, "slickFeatures.json");
        }

        private void WriteToFile(string data, string fileName)
        {
            File.WriteAllText(Environment.CurrentDirectory + @"\" + fileName, data);
            Console.WriteLine(fileName + " done!");
        }

        private TimelineData GenerateTimeline(IEnumerable<BaseData> data)
        {
            var dateList = new List<Date>();
            foreach (var baseData in data)
            {
                dateList.Add(new Date
                {
                    classname = "",
                    endDate = "",
                    headline = baseData.CenterLocation.Place,
                    id = string.Format("aa{0}", baseData.Id.ToString("00000")),
                    startDate = baseData.Date.ToString("yyyy,MM,dd"),
                    tag = "",
                    text = ""
                });
            }
            return new TimelineData
            {
                timeline = new Timeline { headline = "Alliert og alene", text = "", type = "default", date = dateList.ToArray() }
            };
        }

        private GeoData GenerateFeatures(IEnumerable<BaseData> data)
        {
            var featureList = new List<Feature>();
            var i = 0;
            foreach (var baseData in data)
            {
                int j = 0;
                char[] alphabet = { 'a', 'b', 'c', 'd', 'e' };
                foreach (var location in baseData.FeatureLocations)
                {
                    i++;
                    featureList.Add(new Feature
                    {
                        geometry = new Geometry
                        {
                            coordinates = new[] { location.Location.Coordinate.Lat, location.Location.Coordinate.Lng },
                            type = "Point"
                        },
                        id = string.Format("aa{0}{1}", i.ToString("00000"), alphabet[j]),
                        type = "Feature",
                        properties = new Properties
                        {
                            header = baseData.CenterLocation.Place,
                            id = string.Format("aa{0}", baseData.Id.ToString("00000")),
                            place = location.Location.Place,
                            //marker = (int)location.,
                            text = baseData.Text,
                            media = new Media
                            {
                                description = baseData.MediaAssets.First().Description,
                                link = baseData.MediaAssets.First().Reference,
                                type = baseData.MediaAssets.First().MediaType == MediaType.Image
                                    ? "img"
                                    : baseData.MediaAssets.First().MediaType == MediaType.Video ? "video" : "diary",
                                poster = baseData.MediaAssets.First().Poster
                            },
                            time = baseData.Date.ToUnixTime(),
                            centerCoordinates =
                                new[] { baseData.CenterLocation.Coordinate.Lat, baseData.CenterLocation.Coordinate.Lng },
                        }
                    });
                    j++;
                }
            }
            return new GeoData
            {
                features = featureList.ToArray(),
                type = "FeatureCollection",
                metadata = new Metadata
                {
                    count = featureList.Count,
                    generated = DateTime.Now.ToUnixTime(),
                    title = "Alliert og alene"
                }
            };
        }

        private SlickFeature GenerateSlickFeatures(IEnumerable<BaseData> data)
        {
            return new SlickFeature
            {
                dates = data.GroupBy(d => d.Date).Select(baseData => new SlickData
                {
                    date = baseData.Key.ToString("dd. MMMM yyyy"),
                    features = baseData.Select(bd => new FeatureDate
                    {
                        header = bd.CenterLocation.Place,
                        id = string.Format("aa{0}", bd.Id.ToString("00000")),
                    })
                }).ToList()
            };
        }
    }
}
