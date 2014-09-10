using System;
using System.Collections.Generic;
using DataGenerator.Models;

namespace DataGenerator.Services
{
    public class BaseDataService
    {
        public BaseDataService()
        {
            
        }

        public IEnumerable<BaseData> GetData()
        {
            return new List<BaseData>
            {
                new BaseData
                {
                    Text = "<p>På vei til Bergen blir det tyske troppetransportskipet \\\"Rio de Janeiro\\\" senket av den polske ubåten \\\"Orzel\\\" utenfor Lillesand. Soldater i full krigsutrustning og uniform fraktes til Lillesand i lokale båter. De hevdet de var på vei til Bergen for å hjelpe nordmennene - angivelig etter anmodning fra den norske regjering.<\\/p><p>133 overlevende og 10 døde blir tatt inn til Lillesand. I Berlin fryktet man at den planlagte  aksjonen dagen etter var røpet, men sentrale norske myndigheter foretok seg ingenting da hendelsen ble rapportert.<\\/p>",
                    Region = "Sørlandet",
                    Date = new DateTime(1940, 4, 8, 12, 0, 0),
                    Locations = new List<BaseData.Location>
                    {
                        new BaseData.Location
                        {
                            Coordinate = new BaseData.Coordinate
                            {
                                Lat = 58.250169f,
                                Lng = 8.378711f
                            },
                            Place = "Lillesand"
                        },
                        new BaseData.Location
                        {
                            Coordinate = new BaseData.Coordinate
                            {
                                Lat = 60.392097f,
                                Lng = 5.323273f
                            },
                            Place = "Bergen"
                        }
                    },
                    Media = new BaseData.MediaAsset
                    {
                        Description = "",
                        MediaType = MediaType.Image,
                        Reference = "http://upload.wikimedia.org/wikipedia/commons/c/c3/ORP_Orzel.jpg"
                    }
                }
            };
        }
    }
}
